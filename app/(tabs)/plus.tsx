import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Image as ImageIcon, Lightbulb, Contrast, Sparkles, Check, ChevronRight, CreditCard as Edit3, Plus } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useClothes } from '@/hooks/useClothes';
import { storageService } from '@/services/storage';
import { ClothingType, Season, Style } from '@/types/database';

const { width, height } = Dimensions.get('window');

type Step = 'photo' | 'crop' | 'tags' | 'confirm';

interface StepConfig {
  id: Step;
  title: string;
  number: number;
}

const steps: StepConfig[] = [
  { id: 'photo', title: 'Photo', number: 1 },
  { id: 'crop', title: 'Découpe', number: 2 },
  { id: 'tags', title: 'Tags', number: 3 },
  { id: 'confirm', title: 'Confirmer', number: 4 },
];

interface DetectedTag {
  label: string;
  value: string;
  editable: boolean;
  key: keyof ClothingFormData;
}

interface ClothingFormData {
  type: ClothingType;
  color: string;
  material: string;
  season: Season;
  brand: string;
  style: Style;
  size: string;
}

export default function AddItemScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addClothingItem, loading: clothesLoading, error: clothesError } = useClothes();
  
  const [currentStep, setCurrentStep] = useState<Step>('photo');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const progressValue = useSharedValue(0);
  const cropProgressValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  const [formData, setFormData] = useState<ClothingFormData>({
    type: 'top',
    color: '',
    material: '',
    season: 'all',
    brand: '',
    style: 'casual',
    size: '',
  });

  const [detectedTags, setDetectedTags] = useState<DetectedTag[]>([
    { label: 'Type', value: 'T-shirt', editable: true, key: 'type' },
    { label: 'Couleur', value: 'Bleu', editable: true, key: 'color' },
    { label: 'Matière', value: 'Coton', editable: true, key: 'material' },
    { label: 'Saison', value: 'Printemps, Été', editable: true, key: 'season' },
    { label: 'Marque', value: 'Nike', editable: true, key: 'brand' },
    { label: 'Style', value: 'Décontracté', editable: true, key: 'style' },
    { label: 'Taille', value: 'M', editable: true, key: 'size' },
  ]);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  React.useEffect(() => {
    progressValue.value = withSpring((currentStepIndex + 1) / steps.length);
  }, [currentStep, currentStepIndex]);

  // Simulate automatic cropping process
  useEffect(() => {
    if (currentStep === 'crop' && isProcessing) {
      // Start pulse animation
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );

      // Simulate progress
      const interval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsProcessing(false);
            pulseValue.value = withTiming(1, { duration: 300 });
            setTimeout(() => {
              setCurrentStep('tags');
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [currentStep, isProcessing]);

  // Animate crop progress
  useEffect(() => {
    cropProgressValue.value = withTiming(processingProgress / 100, { duration: 100 });
  }, [processingProgress]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
    };
  });

  const cropProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${cropProgressValue.value * 100}%`,
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  const handleImagePicker = async (useCamera: boolean = false) => {
    try {
      let result;
      
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre appareil photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à votre galerie.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setCurrentStep('crop');
        setIsProcessing(true);
        setProcessingProgress(0);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection de l\'image.');
    }
  };

  const handleNextStep = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex].id;
      setCurrentStep(nextStep);
    }
  };

  const handlePreviousStep = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].id);
    }
  };

  const handleConfirm = async () => {
    if (!user || !selectedImage) {
      Alert.alert('Erreur', 'Utilisateur non connecté ou image manquante');
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('🔄 Starting to save clothing item...');
      console.log('User ID:', user.id);
      console.log('Selected Image:', selectedImage);
      console.log('Form Data:', formData);

      // Upload image to Supabase Storage
      const fileName = storageService.generateFileName(user.id);
      console.log('📁 Generated filename:', fileName);
      
      const imageUrl = await storageService.uploadImage(selectedImage, fileName);
      console.log('📤 Image uploaded successfully:', imageUrl);

      // Prepare clothing item data
      const clothingItem = {
        user_id: user.id,
        image_url: imageUrl,
        type: mapTypeToDatabase(detectedTags.find(tag => tag.key === 'type')?.value || 'T-shirt'),
        color: detectedTags.find(tag => tag.key === 'color')?.value || null,
        material: detectedTags.find(tag => tag.key === 'material')?.value || null,
        season: mapSeasonToDatabase(detectedTags.find(tag => tag.key === 'season')?.value || 'Toute saison'),
        brand: detectedTags.find(tag => tag.key === 'brand')?.value || null,
        style: mapStyleToDatabase(detectedTags.find(tag => tag.key === 'style')?.value || 'Décontracté'),
        size: detectedTags.find(tag => tag.key === 'size')?.value || null,
        model: null,
        tags: null,
      };

      console.log('👕 Prepared clothing item:', clothingItem);

      // Save to database using the hook
      const savedItem = await addClothingItem(clothingItem);
      console.log('✅ Item saved successfully:', savedItem);

      Alert.alert(
        'Article ajouté !',
        'Votre vêtement a été ajouté à votre garde-robe.',
        [
          {
            text: 'Voir ma garde-robe',
            onPress: () => {
              resetForm();
              router.replace('/(tabs)/wardrobe');
            }
          },
          {
            text: 'Ajouter un autre',
            onPress: () => {
              resetForm();
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error saving clothing item:', error);
      
      let errorMessage = 'Une erreur est survenue lors de l\'ajout de l\'article.';
      
      if (error instanceof Error) {
        if (error.message.includes('bucket') || error.message.includes('Bucket')) {
          errorMessage = error.message + '\n\nPour résoudre ce problème :\n1. Connectez-vous à votre tableau de bord Supabase\n2. Allez dans Storage\n3. Créez un nouveau bucket nommé "clothes-images"\n4. Configurez-le comme public';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Erreur lors du téléchargement de l\'image. Vérifiez votre connexion et la configuration du stockage.';
        } else if (error.message.includes('database') || error.message.includes('supabase')) {
          errorMessage = 'Erreur de base de données. Veuillez réessayer.';
        } else if (error.message.includes('auth')) {
          errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('photo');
    setSelectedImage(null);
    setFormData({
      type: 'top',
      color: '',
      material: '',
      season: 'all',
      brand: '',
      style: 'casual',
      size: '',
    });
    setDetectedTags([
      { label: 'Type', value: 'T-shirt', editable: true, key: 'type' },
      { label: 'Couleur', value: 'Bleu', editable: true, key: 'color' },
      { label: 'Matière', value: 'Coton', editable: true, key: 'material' },
      { label: 'Saison', value: 'Printemps, Été', editable: true, key: 'season' },
      { label: 'Marque', value: 'Nike', editable: true, key: 'brand' },
      { label: 'Style', value: 'Décontracté', editable: true, key: 'style' },
      { label: 'Taille', value: 'M', editable: true, key: 'size' },
    ]);
    setIsProcessing(false);
    setIsSaving(false);
    setProcessingProgress(0);
    setEditingField(null);
  };

  const mapTypeToDatabase = (displayType: string): ClothingType => {
    const typeMap: { [key: string]: ClothingType } = {
      'T-shirt': 'top',
      'Chemise': 'top',
      'Pull': 'top',
      'Haut': 'top',
      'Veste': 'outerwear',
      'Manteau': 'outerwear',
      'Pantalon': 'bottom',
      'Jean': 'bottom',
      'Short': 'bottom',
      'Jupe': 'bottom',
      'Bas': 'bottom',
      'Robe': 'dress',
      'Chaussures': 'shoes',
      'Baskets': 'shoes',
      'Bottes': 'shoes',
      'Accessoire': 'accessories',
      'Sac': 'accessories',
      'Ceinture': 'accessories',
    };
    
    return typeMap[displayType] || 'top';
  };

  const mapSeasonToDatabase = (displaySeason: string): Season => {
    if (displaySeason.includes('Printemps') && displaySeason.includes('Été')) return 'all';
    if (displaySeason.includes('Printemps')) return 'spring';
    if (displaySeason.includes('Été')) return 'summer';
    if (displaySeason.includes('Automne')) return 'fall';
    if (displaySeason.includes('Hiver')) return 'winter';
    if (displaySeason.includes('Toute saison')) return 'all';
    return 'all';
  };

  const mapStyleToDatabase = (displayStyle: string): Style => {
    const styleMap: { [key: string]: Style } = {
      'Décontracté': 'casual',
      'Formel': 'formal',
      'Sport': 'sport',
      'Chic': 'chic',
      'Vintage': 'vintage',
      'Streetwear': 'streetwear',
    };
    
    return styleMap[displayStyle] || 'casual';
  };

  const handleEditTag = (index: number, newValue: string) => {
    const updatedTags = [...detectedTags];
    updatedTags[index].value = newValue;
    setDetectedTags(updatedTags);

    // Update form data
    const tag = updatedTags[index];
    const updatedFormData = { ...formData };
    
    switch (tag.key) {
      case 'type':
        updatedFormData.type = mapTypeToDatabase(newValue);
        break;
      case 'color':
        updatedFormData.color = newValue;
        break;
      case 'material':
        updatedFormData.material = newValue;
        break;
      case 'season':
        updatedFormData.season = mapSeasonToDatabase(newValue);
        break;
      case 'brand':
        updatedFormData.brand = newValue;
        break;
      case 'style':
        updatedFormData.style = mapStyleToDatabase(newValue);
        break;
      case 'size':
        updatedFormData.size = newValue;
        break;
    }
    
    setFormData(updatedFormData);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground} />
        <Animated.View style={[styles.progressBar, progressStyle]} />
      </View>
      
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= currentStepIndex && styles.stepCircleActive,
              index === currentStepIndex && styles.stepCircleCurrent
            ]}>
              {index < currentStepIndex ? (
                <Check size={12} color="#FFFFFF" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  index <= currentStepIndex && styles.stepNumberActive
                ]}>
                  {step.number}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepTitle,
              index === currentStepIndex && styles.stepTitleActive
            ]}>
              {step.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPhotoStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.photoContainer}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <View style={styles.cameraIconContainer}>
              <Camera size={40} color="#EE7518" />
            </View>
            <Text style={styles.photoTitle}>Prendre une photo</Text>
            <Text style={styles.photoSubtitle}>
              Prenez votre vêtement en photo ou importez depuis votre galerie
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleImagePicker(true)}
        >
          <Camera size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Appareil photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleImagePicker(false)}
        >
          <ImageIcon size={18} color="#1C1C1E" />
          <Text style={styles.secondaryButtonText}>Galerie</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Conseils pour de meilleures photos</Text>
        
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Lightbulb size={18} color="#EE7518" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Bonne luminosité</Text>
            <Text style={styles.tipDescription}>
              Prenez votre photo dans un endroit bien éclairé
            </Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Contrast size={18} color="#EE7518" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Fond contrasté</Text>
            <Text style={styles.tipDescription}>
              Utilisez un fond uni qui contraste avec le vêtement
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCropStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.cropContainer}>
        {selectedImage && (
          <Animated.View style={[styles.imagePreview, pulseStyle]}>
            <Image source={{ uri: selectedImage }} style={styles.cropImage} />
            
            {/* Red checkered overlay for the t-shirt */}
            <View style={styles.cropOverlay}>
              <View style={styles.checkeredPattern} />
            </View>
            
            {/* Processing overlay */}
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <View style={styles.processingContent}>
                  <Text style={styles.processingTitle}>Découpage automatique en cours...</Text>
                  
                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <Animated.View style={[styles.progressFill, cropProgressStyle]} />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </View>
      
      {!isProcessing && (
        <View style={styles.cropInstructions}>
          <Text style={styles.instructionTitle}>Découpage terminé</Text>
          <Text style={styles.instructionText}>
            Notre IA a supprimé l'arrière-plan de votre photo
          </Text>
        </View>
      )}
    </View>
  );

  const renderTagsStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      {/* Clothing Preview */}
      <View style={styles.clothingPreview}>
        {selectedImage && (
          <View style={styles.previewImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          </View>
        )}
        <Text style={styles.clothingTitle}>
          {detectedTags.find(tag => tag.key === 'type')?.value || 'Nouveau vêtement'}
        </Text>
      </View>

      {/* Detected Tags */}
      <View style={styles.tagsContainer}>
        {detectedTags.map((tag, index) => (
          <View key={index} style={styles.tagRow}>
            <Text style={styles.tagLabel}>{tag.label}</Text>
            <View style={styles.tagValueContainer}>
              {editingField === `tag-${index}` ? (
                <TextInput
                  style={styles.tagInput}
                  value={tag.value}
                  onChangeText={(text) => handleEditTag(index, text)}
                  onBlur={() => setEditingField(null)}
                  onSubmitEditing={() => setEditingField(null)}
                  autoFocus
                  placeholder={tag.label === 'Marque' ? 'Ajouter une marque' : ''}
                  placeholderTextColor="#C7C7CC"
                />
              ) : (
                <TouchableOpacity
                  style={styles.tagValueButton}
                  onPress={() => tag.editable && setEditingField(`tag-${index}`)}
                  disabled={!tag.editable}
                >
                  <Text style={[
                    styles.tagValue,
                    !tag.value && styles.tagValueEmpty,
                    !tag.editable && styles.tagValueReadonly
                  ]}>
                    {tag.value || (tag.label === 'Marque' ? 'Ajouter une marque' : '')}
                  </Text>
                  {tag.editable && (
                    <Edit3 size={14} color="#8E8E93" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Success Message */}
      <View style={styles.successMessage}>
        <View style={styles.successIcon}>
          <Check size={18} color="#10B981" />
        </View>
        <View style={styles.successContent}>
          <Text style={styles.successTitle}>Prêt à être ajouté</Text>
          <Text style={styles.successText}>
            Ce vêtement sera ajouté à votre garde-robe et disponible pour créer des tenues.
          </Text>
        </View>
      </View>

      {/* Show any errors from the clothes hook */}
      {clothesError && (
        <View style={styles.errorMessage}>
          <Text style={styles.errorText}>{clothesError}</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderConfirmStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.confirmContainer}>
        <View style={styles.finalPreview}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.finalImage} />
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>
            {detectedTags.find(tag => tag.key === 'type')?.value || 'Nouveau vêtement'}
          </Text>
          <Text style={styles.itemSubtitle}>
            {[
              detectedTags.find(tag => tag.key === 'material')?.value,
              detectedTags.find(tag => tag.key === 'style')?.value,
              detectedTags.find(tag => tag.key === 'brand')?.value
            ].filter(Boolean).join(' • ')}
          </Text>
        </View>

        <View style={styles.detailsList}>
          {detectedTags.filter(tag => tag.key !== 'size').map((tag, index) => (
            <View key={index} style={styles.detailItem}>
              <Text style={styles.detailLabel}>{tag.label}</Text>
              <Text style={styles.detailValue}>{tag.value || '-'}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'photo':
        return renderPhotoStep();
      case 'crop':
        return renderCropStep();
      case 'tags':
        return renderTagsStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return renderPhotoStep();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'photo':
        return selectedImage !== null;
      case 'crop':
        return !isProcessing;
      case 'tags':
        return !isProcessing;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Vous devez être connecté pour ajouter des vêtements</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/auth')}
          >
            <Text style={styles.primaryButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (currentStepIndex > 0) {
              handlePreviousStep();
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft size={20} color="#1C1C1E" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Ajouter un vêtement</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Bottom Actions */}
      {!isProcessing && (
        <View style={styles.bottomActions}>
          {currentStep === 'tags' ? (
            <View style={styles.tagsActions}>
              <TouchableOpacity
                style={styles.modifyButton}
                onPress={() => setCurrentStep('crop')}
              >
                <Text style={styles.modifyButtonText}>Modifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addToWardrobeButton}
                onPress={() => setCurrentStep('confirm')}
              >
                <Text style={styles.addToWardrobeButtonText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          ) : currentStep === 'crop' ? (
            <View style={styles.cropActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCurrentStep('photo')}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.validateButton}
                onPress={handleNextStep}
              >
                <Text style={styles.validateButtonText}>Valider le découpage</Text>
              </TouchableOpacity>
            </View>
          ) : currentStep === 'confirm' ? (
            <TouchableOpacity
              style={[styles.continueButton, styles.confirmButton]}
              onPress={handleConfirm}
              disabled={isSaving || clothesLoading}
            >
              {(isSaving || clothesLoading) ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>Ajouter à ma garde-robe</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.continueButton,
                !canProceed() && styles.continueButtonDisabled
              ]}
              onPress={handleNextStep}
              disabled={!canProceed()}
            >
              <Text style={styles.continueButtonText}>Continuer</Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 36,
  },
  stepIndicator: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#E5E2E1',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E5E2E1',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#EE7518',
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E2E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#EE7518',
  },
  stepCircleCurrent: {
    backgroundColor: '#EE7518',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  photoContainer: {
    marginBottom: 24,
  },
  photoPlaceholder: {
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
  cameraIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  photoSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 15,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  cropContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  imagePreview: {
    position: 'relative',
    width: width - 40,
    height: (width - 40) * 1.2,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  cropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  checkeredPattern: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '30%',
    backgroundColor: '#FF0000',
    opacity: 0.7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  processingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
  },
  processingContent: {
    alignItems: 'center',
  },
  processingTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EE7518',
    borderRadius: 2,
  },
  cropInstructions: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Tags Step Styles
  clothingPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  clothingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  tagsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tagLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    width: 70,
  },
  tagValueContainer: {
    flex: 1,
    marginLeft: 12,
  },
  tagValueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  tagValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    flex: 1,
  },
  tagValueEmpty: {
    color: '#C7C7CC',
    fontWeight: '400',
  },
  tagValueReadonly: {
    color: '#8E8E93',
  },
  tagInput: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#EE7518',
    paddingVertical: 2,
  },
  successMessage: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  successIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  successText: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  errorMessage: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  confirmContainer: {
    alignItems: 'center',
  },
  finalPreview: {
    width: 160,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  finalImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    alignItems: 'center',
    marginBottom: 24,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  detailsList: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  bottomActions: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
  },
  tagsActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modifyButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  modifyButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  addToWardrobeButton: {
    flex: 2,
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToWardrobeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cropActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  validateButton: {
    flex: 2,
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E2E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
});