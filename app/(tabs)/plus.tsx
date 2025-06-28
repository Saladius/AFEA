import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Camera, Plus, Check } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const colors = [
  { label: 'Orange', value: 'orange', color: '#EE7518' },
  { label: 'Noir', value: 'black', color: '#000000' },
  { label: 'Gris', value: 'gray', color: '#6B7280' },
  { label: 'Rouge', value: 'red', color: '#DC2626' },
  { label: 'Bleu', value: 'blue', color: '#2563EB' },
  { label: 'Vert', value: 'green', color: '#16A34A' },
  { label: 'Jaune', value: 'yellow', color: '#EAB308' },
  { label: 'Violet', value: 'purple', color: '#9333EA' },
  { label: 'Rose', value: 'pink', color: '#EC4899' },
  { label: 'Blanc', value: 'white', color: '#FFFFFF' },
  { label: 'Marron', value: 'brown', color: '#A16207' },
  { label: 'Beige', value: 'beige', color: '#D2B48C' }
];

const steps = [
  { id: 'photo', number: '1', title: 'Photo' },
  { id: 'crop', number: '2', title: 'Recadrage' },
  { id: 'tags', number: '3', title: 'Tags' },
  { id: 'confirm', number: '4', title: 'Confirmation' }
];

export default function PlusTab() {
  const [currentStep, setCurrentStep] = useState('photo');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const handleColorSelect = (colorValue: string) => {
    setSelectedColors(prev => 
      prev.includes(colorValue) 
        ? prev.filter(c => c !== colorValue)
        : [...prev, colorValue]
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            index <= getCurrentStepIndex() && styles.stepCircleActive
          ]}>
            <Text style={[
              styles.stepNumber,
              index <= getCurrentStepIndex() && styles.stepNumberActive
            ]}>
              {step.number}
            </Text>
          </View>
          <Text style={[
            styles.stepTitle,
            index <= getCurrentStepIndex() && styles.stepTitleActive
          ]}>
            {step.title}
          </Text>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              index < getCurrentStepIndex() && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderPhotoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Prenez une photo de votre vêtement ou sélectionnez-en une depuis votre galerie
      </Text>
      
      <TouchableOpacity style={styles.cameraButton}>
        <Camera size={48} color="#FFFFFF" />
        <Text style={styles.cameraButtonText}>Prendre une photo</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.galleryButton}>
        <Plus size={24} color="#EE7518" />
        <Text style={styles.galleryButtonText}>Choisir depuis la galerie</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTagsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>
        Sélectionnez les couleurs présentes sur votre vêtement
      </Text>
      
      <View style={styles.colorsGrid}>
        {colors.map((color) => (
          <TouchableOpacity
            key={color.value}
            style={[
              styles.colorItem,
              selectedColors.includes(color.value) && styles.colorItemSelected
            ]}
            onPress={() => handleColorSelect(color.value)}
          >
            <View style={[styles.colorCircle, { backgroundColor: color.color }]}>
              {selectedColors.includes(color.value) && (
                <Check size={16} color={color.color === '#FFFFFF' ? '#000000' : '#FFFFFF'} />
              )}
            </View>
            <Text style={styles.colorLabel}>{color.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'photo':
        return renderPhotoStep();
      case 'crop':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Recadrez votre photo pour mettre en valeur le vêtement
            </Text>
          </View>
        );
      case 'tags':
        return renderTagsStep();
      case 'confirm':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Vérifiez les informations avant d'ajouter le vêtement à votre garde-robe
            </Text>
          </View>
        );
      default:
        return renderPhotoStep();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ajouter un vêtement</Text>
          <Text style={styles.subtitle}>Enrichissez votre garde-robe virtuelle</Text>
        </View>

        {renderStepIndicator()}
        {renderCurrentStep()}

        <View style={styles.buttonContainer}>
          {getCurrentStepIndex() > 0 && (
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                const prevStep = steps[getCurrentStepIndex() - 1];
                setCurrentStep(prevStep.id);
              }}
            >
              <Text style={styles.secondaryButtonText}>Précédent</Text>
            </TouchableOpacity>
          )}
          
          {getCurrentStepIndex() < steps.length - 1 && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => {
                const nextStep = steps[getCurrentStepIndex() + 1];
                setCurrentStep(nextStep.id);
              }}
            >
              <Text style={styles.primaryButtonText}>Suivant</Text>
            </TouchableOpacity>
          )}
          
          {getCurrentStepIndex() === steps.length - 1 && (
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Ajouter le vêtement</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E2E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#EE7518',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#EE7518',
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: '#E5E2E1',
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: '#EE7518',
  },
  stepContent: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  cameraButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  galleryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EE7518',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButtonText: {
    color: '#EE7518',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  colorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorItem: {
    width: (width - 72) / 4,
    alignItems: 'center',
    marginBottom: 24,
    padding: 8,
  },
  colorItemSelected: {
    backgroundColor: '#E5E2E1',
    borderRadius: 12,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  colorLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#EE7518',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E2E1',
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
});