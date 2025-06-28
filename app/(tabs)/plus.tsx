import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Image as ImageIcon, X, Plus } from 'lucide-react-native';
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

interface ClothingFormData {
  type: ClothingType;
  color: string;
  material: string;
  season: Season;
  brand: string;
  style: Style;
  size: string;
  name: string;
}

// Suggested tags for each category
const suggestedTags = {
  type: [
    { label: 'T-shirt', value: 'top' },
    { label: 'Polo', value: 'top' },
    { label: 'Chemise', value: 'top' },
    { label: 'Pull', value: 'top' },
    { label: 'Sweat', value: 'top' },
    { label: 'Veste', value: 'outerwear' },
    { label: 'Manteau', value: 'outerwear' },
    { label: 'Jean', value: 'bottom' },
    { label: 'Pantalon', value: 'bottom' },
    { label: 'Short', value: 'bottom' },
    { label: 'Jupe', value: 'bottom' },
    { label: 'Robe', value: 'dress' },
    { label: 'Baskets', value: 'shoes' },
    { label: 'Chaussures', value: 'shoes' },
    { label: 'Bottes', value: 'shoes' },
    { label: 'Sac', value: 'accessories' },
    { label: 'Ceinture', value: 'accessories' },
    { label: 'Chapeau', value: 'accessories' },
  ],
  season: [
    { label: 'Printemps', value: 'spring' },
    { label: 'Été', value: 'summer' },
    { label: 'Automne', value: 'fall' },
    { label: 'Hiver', value: 'winter' },
    { label: 'Toute saison', value: 'all' },
  ],
  style: [
    { label: 'Décontracté', value: 'casual' },
    { label: 'Formel', value: 'formal' },
    { label: 'Sport', value: 'sport' },
    { label: 'Chic', value: 'chic' },
    { label: 'Vintage', value: 'vintage' },
    { label: 'Streetwear', value: 'streetwear' },
  ],
  size: [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 
    '34', '36', '38', '40', '42', '44', '46', '48',
    '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'
  ]
};

export default function AddItemScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addClothingItem, loading: clothesLoading, error: clothesError } = useClothes();
  
  const [currentStep, setCurrentStep] = useState<Step>('photo');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageMimeType, setSelectedImageMimeType] = useState<string>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
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
    name: '',
  });

  // State for selected tags (only one per category)
  const [selectedTags, setSelectedTags] = useState<{
    type: string | null;
    season: string | null;
    style: string | null;
    size: string | null;
  }>({
    type: null,
    season: null,
    style: null,
    size: null
  });

  // State for custom tags
  const [customTags, setCustomTags] = useState<{
    type: string[];
    season: string[];
    style: string[];
    size: string[];
  }>({
    type: [],
    season: [],
    style: [],
    size: []
  });

  // State for new tag inputs
  const [newTagInputs, setNewTagInputs] = useState<{
    type: string;
    season: string;
    style: string;
    size: string;
  }>({
    type: '',
    season: '',
    style: '',
    size: ''
  });

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  React.useEffect(() => {
    progressValue.value = withSpring((currentStepIndex + 1) / steps.length);
  }, [currentStep, currentStepIndex]);

  // Simulate automatic cropping process
  React.useEffect(() => {
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
  React.useEffect(() => {
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
          allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp'],
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
          allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp'],
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate image format on client side
        const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const mimeType = asset.mimeType || 'image/jpeg';
        
        console.log('📷 Selected image details:', {
          uri: asset.uri,
          mimeType: mimeType,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        });
        
        if (!supportedTypes.includes(mimeType)) {
          console.error('❌ CLIENT ERROR: Unsupported image format:', mimeType);
          Alert.alert(
            'Format non supporté', 
            `Le format d'image ${mimeType} n'est pas supporté. Veuillez utiliser JPEG, PNG ou WebP.`
          );
          return;
        }
        
        // Check file size (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          console.error('❌ CLIENT ERROR: File too large:', asset.fileSize);
          Alert.alert(
            'Fichier trop volumineux', 
            'La taille de l\'image ne doit pas dépasser 5MB.'
          );
          return;
        }
        
        // Validate file before proceeding
        const validation = storageService.validateFile(asset.uri, mimeType, asset.fileSize);
        if (!validation.valid) {
          console.error('❌ CLIENT ERROR: File validation failed:', validation.error);
          Alert.alert('Fichier invalide', validation.error);
          return;
        }
        
        setSelectedImage(result.assets[0].uri);
        // Store the mimeType for later use in upload
        setSelectedImageMimeType(mimeType);
        setCurrentStep('crop');
        setIsProcessing(true);
        setProcessingProgress(0);
      }
    } catch (error) {
      console.error('❌ CLIENT ERROR: Image picker error:', error);
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
      
      const imageUrl = await storageService.uploadImage(selectedImage, fileName, selectedImageMimeType);
      console.log('📤 Image uploaded successfully:', imageUrl);

      // Prepare clothing item data
      const clothingItem = {
        user_id: user.id,
        image_url: imageUrl,
        type: formData.type,
        color: formData.color || null,
        material: formData.material || null,
        season: formData.season,
        brand: formData.brand || null,
        style: formData.style,
        size: formData.size || null,
        model: formData.name || null,
        tags: null,
      };

      console.log('👕 Prepared clothing item:', clothingItem);

      // Save to database using the hook
      const savedItem = await addClothingItem(clothingItem);
      console.log('✅ Item saved successfully:', savedItem);

      // Show success modal
      setShowSuccessModal(true);
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

  const handleSuccessAction = (action: 'wardrobe' | 'another') => {
    setShowSuccessModal(false);
    resetForm();
    
    if (action === 'wardrobe') {
      setTimeout(() => {
        router.replace('/(tabs)/wardrobe');
      }, 300);
    }
  };

  const resetForm = () => {
    setCurrentStep('photo');
    setSelectedImage(null);
    setSelectedImageMimeType('image/jpeg');
    setFormData({
      type: 'top',
      color: '',
      material: '',
      season: 'all',
      brand: '',
      style: 'casual',
      size: '',
      name: '',
    });
    setSelectedTags({
      type: null,
      season: null,
      style: null,
      size: null
    });
    setCustomTags({
      type: [],
      season: [],
      style: [],
      size: []
    });
    setNewTagInputs({
      type: '',
      season: '',
      style: '',
      size: ''
    });
    setIsProcessing(false);
    setIsSaving(false);
    setProcessingProgress(0);
    setShowSuccessModal(false);
  };

  // Function to add a custom tag
  const addCustomTag = (category: keyof typeof customTags) => {
    const newTag = newTagInputs[category].trim();
    if (newTag && !customTags[category].includes(newTag)) {
      setCustomTags(prev => ({
        ...prev,
        [category]: [...prev[category], newTag]
      }));
      setNewTagInputs(prev => ({
        ...prev,
        [category]: ''
      }));
    }
  };

  // Function to remove a custom tag
  const removeCustomTag = (category: keyof typeof customTags, tagToRemove: string) => {
    setCustomTags(prev => ({
      ...prev,
      [category]: prev[category].filter(tag => tag !== tagToRemove)
    }));
    // If the removed tag was selected, deselect it
    if (selectedTags[category] === tagToRemove) {
      setSelectedTags(prev => ({
        ...prev,
        [category]: null
      }));
    }
  };

  // Function to select a tag (only one per category)
  const selectTag = (category: keyof typeof selectedTags, tag: string) => {
    setSelectedTags(prev => ({
      ...prev,
      [category]: prev[category] === tag ? null : tag // Toggle selection
    }));

    // Update form data based on selection
    if (category === 'type') {
      const value = suggestedTags.type.find(t => t.label === tag)?.value || tag;
      setFormData(prev => ({ ...prev, type: value as ClothingType }));
    } else if (category === 'season') {
      const value = suggestedTags.season.find(t => t.label === tag)?.value || tag;
      setFormData(prev => ({ ...prev, season: value as Season }));
    } else if (category === 'style') {
      const value = suggestedTags.style.find(t => t.label === tag)?.value || tag;
      setFormData(prev => ({ ...prev, style: value as Style }));
    } else if (category === 'size') {
      setFormData(prev => ({ ...prev, size: tag }));
    }
  };

  // Function to get all available tags for a category
  const getAllTagsForCategory = (category: string) => {
    switch (category) {
      case 'type':
        return [...suggestedTags.type.map(t => t.label), ...customTags.type];
      case 'season':
        return [...suggestedTags.season.map(t => t.label), ...customTags.season];
      case 'style':
        return [...suggestedTags.style.map(t => t.label), ...customTags.style];
      case 'size':
        return [...suggestedTags.size, ...customTags.size];
      default:
        return [];
    }
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
                <Text style={styles.checkmark}>✓</Text>
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
    </ScrollView>
  );

  const renderCropStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.cropContainer}>
        {selectedImage && (
          <Animated.View style={[styles.imagePreview, pulseStyle]}>
            <Image source={{ uri: selectedImage }} style={styles.cropImage} />
            
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <View style={styles.processingContent}>
                  <Text style={styles.processingTitle}>Découpage automatique en cours...</Text>
                  
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
      {/* Image Preview */}
      <View style={styles.imagePreviewContainer}>
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        )}
      </View>

      {/* Tags générés section */}
      <View style={styles.tagsSection}>
        <Text style={styles.sectionTitle}>Tags générés</Text>
        
        {/* Type */}
        <View style={styles.tagCategory}>
          <Text style={styles.tagCategoryLabel}>Type</Text>
          <View style={styles.tagChipsContainer}>
            {getAllTagsForCategory('type').map((tag, index) => {
              const isSelected = selectedTags.type === tag;
              const isCustom = customTags.type.includes(tag);
              
              return (
                <View key={index} style={styles.tagChipWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected
                    ]}
                    onPress={() => selectTag('type', tag)}
                  >
                    <Text style={[
                      styles.tagChipText,
                      isSelected && styles.tagChipTextSelected
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                  {isCustom && (
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={() => removeCustomTag('type', tag)}
                    >
                      <X size={12} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Add custom type tag */}
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.addTagInput}
              placeholder="Ajouter un type personnalisé"
              placeholderTextColor="#C7C7CC"
              value={newTagInputs.type}
              onChangeText={(text) => setNewTagInputs(prev => ({ ...prev, type: text }))}
              onSubmitEditing={() => addCustomTag('type')}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => addCustomTag('type')}
              disabled={!newTagInputs.type.trim()}
            >
              <Plus size={16} color={newTagInputs.type.trim() ? "#EE7518" : "#C7C7CC"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Saison */}
        <View style={styles.tagCategory}>
          <Text style={styles.tagCategoryLabel}>Saison</Text>
          <View style={styles.tagChipsContainer}>
            {getAllTagsForCategory('season').map((tag, index) => {
              const isSelected = selectedTags.season === tag;
              const isCustom = customTags.season.includes(tag);
              
              return (
                <View key={index} style={styles.tagChipWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected
                    ]}
                    onPress={() => selectTag('season', tag)}
                  >
                    <Text style={[
                      styles.tagChipText,
                      isSelected && styles.tagChipTextSelected
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                  {isCustom && (
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={() => removeCustomTag('season', tag)}
                    >
                      <X size={12} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Add custom season tag */}
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.addTagInput}
              placeholder="Ajouter une saison personnalisée"
              placeholderTextColor="#C7C7CC"
              value={newTagInputs.season}
              onChangeText={(text) => setNewTagInputs(prev => ({ ...prev, season: text }))}
              onSubmitEditing={() => addCustomTag('season')}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => addCustomTag('season')}
              disabled={!newTagInputs.season.trim()}
            >
              <Plus size={16} color={newTagInputs.season.trim() ? "#EE7518" : "#C7C7CC"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Style */}
        <View style={styles.tagCategory}>
          <Text style={styles.tagCategoryLabel}>Style</Text>
          <View style={styles.tagChipsContainer}>
            {getAllTagsForCategory('style').map((tag, index) => {
              const isSelected = selectedTags.style === tag;
              const isCustom = customTags.style.includes(tag);
              
              return (
                <View key={index} style={styles.tagChipWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected
                    ]}
                    onPress={() => selectTag('style', tag)}
                  >
                    <Text style={[
                      styles.tagChipText,
                      isSelected && styles.tagChipTextSelected
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                  {isCustom && (
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={() => removeCustomTag('style', tag)}
                    >
                      <X size={12} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Add custom style tag */}
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.addTagInput}
              placeholder="Ajouter un style personnalisé"
              placeholderTextColor="#C7C7CC"
              value={newTagInputs.style}
              onChangeText={(text) => setNewTagInputs(prev => ({ ...prev, style: text }))}
              onSubmitEditing={() => addCustomTag('style')}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => addCustomTag('style')}
              disabled={!newTagInputs.style.trim()}
            >
              <Plus size={16} color={newTagInputs.style.trim() ? "#EE7518" : "#C7C7CC"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Taille */}
        <View style={styles.tagCategory}>
          <Text style={styles.tagCategoryLabel}>Taille</Text>
          <View style={styles.tagChipsContainer}>
            {getAllTagsForCategory('size').map((tag, index) => {
              const isSelected = selectedTags.size === tag;
              const isCustom = customTags.size.includes(tag);
              
              return (
                <View key={index} style={styles.tagChipWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.tagChip,
                      isSelected && styles.tagChipSelected
                    ]}
                    onPress={() => selectTag('size', tag)}
                  >
                    <Text style={[
                      styles.tagChipText,
                      isSelected && styles.tagChipTextSelected
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                  {isCustom && (
                    <TouchableOpacity
                      style={styles.removeTagButton}
                      onPress={() => removeCustomTag('size', tag)}
                    >
                      <X size={12} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* Add custom size tag */}
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.addTagInput}
              placeholder="Ajouter une taille personnalisée"
              placeholderTextColor="#C7C7CC"
              value={newTagInputs.size}
              onChangeText={(text) => setNewTagInputs(prev => ({ ...prev, size: text }))}
              onSubmitEditing={() => addCustomTag('size')}
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => addCustomTag('size')}
              disabled={!newTagInputs.size.trim()}
            >
              <Plus size={16} color={newTagInputs.size.trim() ? "#EE7518" : "#C7C7CC"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Manual inputs */}
      <View style={styles.manualInputsSection}>
        <Text style={styles.sectionTitle}>Détails du vêtement</Text>
        
        <Text style={styles.inputLabel}>Nom du vêtement</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(name) => setFormData(prev => ({ ...prev, name }))}
          placeholder="T-shirt bleu basique"
          placeholderTextColor="#C7C7CC"
        />

        <Text style={styles.inputLabel}>Couleur</Text>
        <TextInput
          style={styles.textInput}
          value={formData.color}
          onChangeText={(color) => setFormData(prev => ({ ...prev, color }))}
          placeholder="Bleu, Rouge, Blanc..."
          placeholderTextColor="#C7C7CC"
        />

        <Text style={styles.inputLabel}>Matière</Text>
        <TextInput
          style={styles.textInput}
          value={formData.material}
          onChangeText={(material) => setFormData(prev => ({ ...prev, material }))}
          placeholder="Coton, Jersey, Lin..."
          placeholderTextColor="#C7C7CC"
        />

        <Text style={styles.inputLabel}>Marque (optionnel)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.brand}
          onChangeText={(brand) => setFormData(prev => ({ ...prev, brand }))}
          placeholder="Entrez la marque..."
          placeholderTextColor="#C7C7CC"
        />
      </View>

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
            {formData.name || 'Nouveau vêtement'}
          </Text>
          <Text style={styles.itemSubtitle}>
            {[formData.material, formData.color, formData.brand].filter(Boolean).join(' • ')}
          </Text>
        </View>

        <View style={styles.detailsList}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>
              {selectedTags.type || formData.type}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Couleur</Text>
            <Text style={styles.detailValue}>{formData.color || '-'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Matière</Text>
            <Text style={styles.detailValue}>{formData.material || '-'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Saison</Text>
            <Text style={styles.detailValue}>
              {selectedTags.season || formData.season}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Style</Text>
            <Text style={styles.detailValue}>
              {selectedTags.style || formData.style}
            </Text>
          </View>
          {formData.size && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Taille</Text>
              <Text style={styles.detailValue}>{formData.size}</Text>
            </View>
          )}
          {formData.brand && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Marque</Text>
              <Text style={styles.detailValue}>{formData.brand}</Text>
            </View>
          )}
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
        return !isProcessing && formData.name.trim() !== '';
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
          {currentStep === 'confirm' ? (
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
          ) : currentStep === 'tags' ? (
            <TouchableOpacity
              style={[
                styles.continueButton,
                !canProceed() && styles.continueButtonDisabled
              ]}
              onPress={handleNextStep}
              disabled={!canProceed()}
            >
              <Text style={styles.continueButtonText}>Continuer</Text>
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
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>

    {/* Success Modal */}
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.successModalOverlay}>
        <View style={styles.successModalContainer}>
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>
          </View>

          {/* Success Content */}
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>Article ajouté !</Text>
            <Text style={styles.successMessage}>
              Votre vêtement a été ajouté à votre garde-robe avec succès.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.successSecondaryButton}
              onPress={() => handleSuccessAction('another')}
            >
              <Text style={styles.successSecondaryButtonText}>Ajouter un autre</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.successPrimaryButton}
              onPress={() => handleSuccessAction('wardrobe')}
            >
              <Text style={styles.successPrimaryButtonText}>Voir ma garde-robe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
    marginBottom: 8,
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
  
  // Step Indicator
  stepIndicator: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
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
    width: 20,
    height: 20,
    borderRadius: 10,
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
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 9,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  
  // Content
  content: {
    flex: 1,
    marginHorizontal: 16,
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  
  // Photo Step
  photoContainer: {
    marginBottom: 32,
  },
  photoPlaceholder: {
    height: 200,
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
    height: 200,
    borderRadius: 16,
  },
  cameraIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  photoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  photoSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  
  // Action Buttons
  actionButtons: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 16,
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
    paddingVertical: 16,
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
  
  // Crop Step
  cropContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  imagePreview: {
    position: 'relative',
    width: width - 80,
    height: (width - 80) * 1.2,
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
    paddingVertical: 32,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Tags Step
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  tagsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  tagCategory: {
    marginBottom: 20,
  },
  tagCategoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  tagChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChipWrapper: {
    position: 'relative',
  },
  tagChip: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    paddingRight: 24, // Extra space for remove button
  },
  tagChipSelected: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  tagChipText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  tagChipTextSelected: {
    color: '#FFFFFF',
  },
  removeTagButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  addTagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E2E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualInputsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  errorMessage: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 16,
  },
  
  // Confirm Step
  confirmContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  finalPreview: {
    width: 160,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
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
    marginBottom: 32,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
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
    padding: 24,
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
    paddingVertical: 12,
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
  
  // Bottom Actions
  bottomActions: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
    marginTop: 16,
  },
  continueButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 16,
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

  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EE7518',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successCheckmark: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successContent: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  successPrimaryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  successPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successSecondaryButton: {
    backgroundColor: '#E5E2E1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  successSecondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
});