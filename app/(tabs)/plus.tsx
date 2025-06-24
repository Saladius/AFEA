import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { 
  ArrowLeft, 
  Camera, 
  Image as ImageIcon, 
  Lightbulb,
  Contrast,
  Sparkles,
  Check,
  ChevronRight
} from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate
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

export default function AddItemScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('photo');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const progressValue = useSharedValue(0);

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  React.useEffect(() => {
    progressValue.value = withSpring((currentStepIndex + 1) / steps.length);
  }, [currentStep, currentStepIndex]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
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
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.cropImage} />
            <View style={styles.cropOverlay}>
              <View style={styles.cropGuide} />
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.cropInstructions}>
        <Text style={styles.instructionTitle}>Ajustez le cadrage</Text>
        <Text style={styles.instructionText}>
          Assurez-vous que le vêtement est bien centré et visible
        </Text>
      </View>
    </View>
  );

  const renderTagsStep = () => (
    <View style={styles.stepContent}>
      {isProcessing ? (
        <View style={styles.processingContainer}>
          <View style={styles.processingAnimation}>
            <Sparkles size={64} color="#EE7518" />
          </View>
          <Text style={styles.processingTitle}>Analyse en cours...</Text>
          <Text style={styles.processingSubtitle}>
            Notre IA analyse votre vêtement pour identifier ses caractéristiques
          </Text>
        </View>
      ) : (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsTitle}>Tags détectés</Text>
          <View style={styles.tagsList}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>T-shirt</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Bleu</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Coton</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Décontracté</Text>
            </View>
          </View>
        </View>
      )}
    </View>
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
        return true;
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
          {currentStep === 'confirm' ? (
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
    height: width - 48,
    borderRadius: 20,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropGuide: {
    width: '80%',
    height: '80%',
    borderWidth: 2,
    borderColor: '#EE7518',
    borderRadius: 12,
    borderStyle: 'dashed',
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
  processingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  tagsContainer: {
    flex: 1,
  },
  tagsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 24,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    backgroundColor: '#FEF3E2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EE7518',
  },
  tagText: {
    fontSize: 14,
    color: '#EE7518',
    fontWeight: '500',
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