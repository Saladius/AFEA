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
  interpolate,
  withRepeat,
  withSequence
} from 'react-native-reanimated';

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
}

export default function AddItemScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('tags'); // Start at tags step for demo
  const [selectedImage, setSelectedImage] = useState<string | null>('https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const progressValue = useSharedValue(0);
  const cropProgressValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  const [detectedTags, setDetectedTags] = useState<DetectedTag[]>([
    { label: 'Type', value: 'T-shirt', editable: true },
    { label: 'Couleur', value: 'Bleu', editable: true },
    { label: 'Matière', value: 'Coton', editable: true },
    { label: 'Saison', value: 'Printemps, Été', editable: true },
    { label: 'Marque', value: '', editable: true },
    { label: 'Ajouté le', value: '19 juin 2023', editable: false },
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
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection de l\'image.');
    }
  };

  const handleNextStep = () => {
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex].id;
      
      if (nextStep === 'tags') {
        setIsProcessing(true);
        // Simulate AI processing
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep(nextStep);
        }, 2000);
      } else {
        setCurrentStep(nextStep);
      }
    }
  };

  const handlePreviousStep = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].id);
    }
  };

  const handleConfirm = () => {
    Alert.alert(
      'Article ajouté !',
      'Votre vêtement a été ajouté à votre garde-robe.',
      [
        {
          text: 'OK',
          onPress: () => {
            setCurrentStep('photo');
            setSelectedImage(null);
            router.back();
          }
        }
      ]
    );
  };

  const handleEditTag = (index: number, newValue: string) => {
    const updatedTags = [...detectedTags];
    updatedTags[index].value = newValue;
    setDetectedTags(updatedTags);
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
                <Check size={16} color="#FFFFFF" />
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
              <Camera size={48} color="#EE7518" />
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
          <Camera size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Appareil photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleImagePicker(false)}
        >
          <ImageIcon size={20} color="#1C1C1E" />
          <Text style={styles.secondaryButtonText}>Galerie</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Conseils pour de meilleures photos</Text>
        
        <View style={styles.tipItem}>
          <View style={styles.tipIcon}>
            <Lightbulb size={20} color="#EE7518" />
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
            <Contrast size={20} color="#EE7518" />
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
          <Text style={styles.instructionTitle}>Découpage en cours</Text>
          <Text style={styles.instructionText}>
            Notre IA supprime l'arrière-plan de votre photo
          </Text>
          
          {/* Warning message */}
          <View style={styles.warningContainer}>
            <View style={styles.warningIcon}>
              <Text style={styles.warningEmoji}>⚠️</Text>
            </View>
            <Text style={styles.warningText}>
              Le découpage automatique peut prendre quelques secondes selon la complexité de l'image.
            </Text>
          </View>
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
        <Text style={styles.clothingTitle}>T-shirt bleu basique</Text>
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
                    <Edit3 size={16} color="#8E8E93" />
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
          <Check size={20} color="#10B981" />
        </View>
        <View style={styles.successContent}>
          <Text style={styles.successTitle}>Prêt à être ajouté</Text>
          <Text style={styles.successText}>
            Ce vêtement sera ajouté à votre garde-robe et disponible pour créer des tenues.
          </Text>
        </View>
      </View>
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
          <Text style={styles.itemTitle}>T-shirt bleu</Text>
          <Text style={styles.itemSubtitle}>Coton • Décontracté • Taille M</Text>
        </View>

        <View style={styles.detailsList}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>T-shirt</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Couleur</Text>
            <Text style={styles.detailValue}>Bleu</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Matière</Text>
            <Text style={styles.detailValue}>Coton</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Style</Text>
            <Text style={styles.detailValue}>Décontracté</Text>
          </View>
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
          <ArrowLeft size={24} color="#1C1C1E" />
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
                onPress={handleConfirm}
              >
                <Text style={styles.addToWardrobeButtonText}>Ajouter à ma garde-robe</Text>
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
            >
              <Text style={styles.continueButtonText}>Ajouter à ma garde-robe</Text>
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
              <ChevronRight size={20} color="#FFFFFF" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E2E1',
    borderRadius: 2,
    marginBottom: 24,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E2E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#EE7518',
  },
  stepCircleCurrent: {
    backgroundColor: '#EE7518',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 12,
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
    padding: 24,
  },
  photoContainer: {
    marginBottom: 32,
  },
  photoPlaceholder: {
    height: 300,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
  },
  cameraIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  photoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  photoSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  actionButtons: {
    gap: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#E5E2E1',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  cropContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    position: 'relative',
    width: width - 48,
    height: (width - 48) * 1.2,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
    // Create checkered pattern effect
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  processingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  processingContent: {
    alignItems: 'center',
  },
  processingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 4,
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
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    maxWidth: width - 80,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningEmoji: {
    fontSize: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  
  // Tags Step Styles
  clothingPreview: {
    alignItems: 'center',
    marginBottom: 32,
  },
  previewImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  clothingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  tagsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tagLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
    width: 80,
  },
  tagValueContainer: {
    flex: 1,
    marginLeft: 16,
  },
  tagValueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tagValue: {
    fontSize: 16,
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
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#EE7518',
    paddingVertical: 4,
  },
  successMessage: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },

  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  processingAnimation: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF3E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  confirmContainer: {
    alignItems: 'center',
  },
  finalPreview: {
    width: 200,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  itemSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  detailsList: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  bottomActions: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
  },
  tagsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modifyButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E2E1',
  },
  modifyButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  addToWardrobeButton: {
    flex: 2,
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  addToWardrobeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cropActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E2E1',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  validateButton: {
    flex: 2,
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#E5E2E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
});