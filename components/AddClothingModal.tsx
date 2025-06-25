import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ClothingItem, ClothingType, Season, Style } from '@/types/database';
import { Camera, Upload, X } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

interface AddClothingModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd?: (item: Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'>) => void;
}

const CLOTHING_TYPES: ClothingType[] = ['top', 'bottom', 'shoes', 'accessories', 'outerwear', 'dress', 'suit'];
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];
const STYLES: Style[] = ['casual', 'formal', 'sport', 'chic', 'vintage', 'streetwear'];

export default function AddClothingModal({ visible, onClose, onAdd }: AddClothingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    image_url: '',
    type: 'top' as ClothingType,
    color: '',
    season: 'all' as Season,
    size: '',
    material: '',
    style: 'casual' as Style,
    brand: '',
    model: '',
  });

  const resetForm = () => {
    setFormData({
      image_url: '',
      type: 'top',
      color: '',
      season: 'all',
      size: '',
      material: '',
      style: 'casual',
      brand: '',
      model: '',
    });
  };

  const handleImagePicker = async (useCamera: boolean = false) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp'],
    };

    let result;
    if (useCamera) {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
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
          'Unsupported Format', 
          `Image format ${mimeType} is not supported. Please use JPEG, PNG, or WebP.`
        );
        return;
      }
      
      // Check file size (5MB limit)
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        console.error('❌ CLIENT ERROR: File too large:', asset.fileSize);
        Alert.alert(
          'File Too Large', 
          'Image size must not exceed 5MB.'
        );
        return;
      }
      
      setFormData(prev => ({ ...prev, image_url: asset.uri }));
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.image_url || !formData.type) {
      Alert.alert('Error', 'Please fill in required fields and add an image');
      return;
    }

    setLoading(true);
    try {
      const item: Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        image_url: formData.image_url,
        type: formData.type,
        color: formData.color || null,
        season: formData.season || null,
        size: formData.size || null,
        material: formData.material || null,
        style: formData.style || null,
        brand: formData.brand || null,
        model: formData.model || null,
        tags: null,
      };

      if (onAdd) {
        await onAdd(item);
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add clothing item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Clothing Item</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo</Text>
            {formData.image_url ? (
              <Image source={{ uri: formData.image_url }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Camera size={32} color="#6B7280" />
                <Text style={styles.imagePlaceholderText}>Add a photo of your clothing item</Text>
              </View>
            )}
            
            <View style={styles.imageButtons}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleImagePicker(true)}
                disabled={loading}
              >
                <Camera size={20} color="#EE7518" />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => handleImagePicker(false)}
                disabled={loading}
              >
                <Upload size={20} color="#EE7518" />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                {CLOTHING_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.option,
                      formData.type === type && styles.optionSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type }))}
                  >
                    <Text style={[
                      styles.optionText,
                      formData.type === type && styles.optionTextSelected
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Color</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Blue, Red, White"
                value={formData.color}
                onChangeText={(color) => setFormData(prev => ({ ...prev, color }))}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Nike, Zara, H&M"
                value={formData.brand}
                onChangeText={(brand) => setFormData(prev => ({ ...prev, brand }))}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Size</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., S, M, L, XL"
                value={formData.size}
                onChangeText={(size) => setFormData(prev => ({ ...prev, size }))}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Add to Wardrobe</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  imagePlaceholderText: {
    color: '#6B7280',
    fontSize: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EE7518',
    gap: 8,
  },
  imageButtonText: {
    color: '#EE7518',
    fontSize: 16,
    fontWeight: '500',
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  optionsScroll: {
    flexGrow: 0,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E2E1',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  optionSelected: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
  },
  submitButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});