import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

class StorageService {
  private bucketName = 'clothes-images';

  async uploadImage(uri: string, fileName: string, mimeType?: string): Promise<string> {
    try {
      console.log('🔄 Starting image upload with FileSystem:', { uri, fileName, mimeType });
      
      // Get Supabase configuration
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuration Supabase manquante');
      }

      // Determine content type from mimeType or default to jpeg
      const contentType = mimeType || 'image/jpeg';
      console.log('📤 Using content type:', contentType);

      // Construct the upload URL
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${this.bucketName}/${fileName}`;
      
      console.log('📤 Upload URL:', uploadUrl);

      // Upload using FileSystem
      const result = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: 'POST',
        headers: {
          'Content-Type': contentType,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      console.log('📤 Upload result:', result);

      if (result.status !== 200) {
        console.error('❌ Upload failed with status:', result.status);
        
        // Handle specific error cases
        if (result.status === 404) {
          throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas dans votre projet Supabase.

🔧 SOLUTION MANUELLE REQUISE :
1. Connectez-vous à votre tableau de bord Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "Storage" dans le menu de gauche
4. Cliquez sur "New bucket"
5. Nommez le bucket exactement : "${this.bucketName}"
6. Cochez "Public bucket" pour permettre l'accès aux images
7. Définissez la limite de taille : 5242880 (5MB)
8. Dans "Allowed MIME types", ajoutez : image/jpeg,image/png,image/webp
9. Cliquez sur "Create bucket"
10. Réessayez d'ajouter votre vêtement

Une fois le bucket créé manuellement, l'application fonctionnera correctement.`);
        } else if (result.status === 400) {
          throw new Error(`Erreur de format d'image. Vérifiez que le fichier est une image valide (JPEG, PNG, WebP).`);
        }
        
        throw new Error(`Erreur lors du téléchargement: ${result.status}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('🔗 Public URL generated:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('❌ Error uploading image:', error);
      // Try fallback method if primary upload fails
      console.log('🔄 Attempting fallback upload method...');
      try {
        return await this.uploadImageFallback(uri, fileName, mimeType);
      } catch (fallbackError) {
        console.error('❌ Fallback upload also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
  }

  async deleteImage(fileName: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas.`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  generateFileName(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${userId}/${timestamp}-${random}.jpg`;
  }

  // Helper method to check if bucket exists
  async checkBucketExists(): Promise<boolean> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ Error listing buckets:', error);
        return false;
      }

      return buckets?.some(bucket => bucket.name === this.bucketName) || false;
    } catch (error) {
      console.error('❌ Error checking bucket existence:', error);
      return false;
    }
  }

  // Alternative upload method using Supabase client (fallback)
  async uploadImageFallback(uri: string, fileName: string, mimeType?: string): Promise<string> {
    try {
      console.log('🔄 Using fallback upload method');
      
      // Convert URI to blob for web or array buffer for mobile
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Determine content type from mimeType, blob type, or default to jpeg
      const contentType = mimeType || blob.type || 'image/jpeg';
      console.log('📤 Fallback using content type:', contentType);
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, blob, {
          contentType: contentType,
          upsert: true
        });

      if (error) {
        console.error('❌ Fallback upload error:', error);
        
        if (error.message.includes('Bucket not found') || error.message.includes('bucket') || error.message.includes('404')) {
          throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas dans votre projet Supabase.

🔧 SOLUTION MANUELLE REQUISE :
1. Connectez-vous à votre tableau de bord Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "Storage" dans le menu de gauche
4. Cliquez sur "New bucket"
5. Nommez le bucket exactement : "${this.bucketName}"
6. Cochez "Public bucket" pour permettre l'accès aux images
7. Définissez la limite de taille : 5242880 (5MB)
8. Dans "Allowed MIME types", ajoutez : image/jpeg,image/png,image/webp
9. Cliquez sur "Create bucket"
10. Réessayez d'ajouter votre vêtement

Une fois le bucket créé manuellement, l'application fonctionnera correctement.`);
        }
        
        throw new Error(`Erreur lors du téléchargement: ${error.message}`);
      }

      console.log('✅ Fallback upload successful:', data);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log('🔗 Public URL generated:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('❌ Error in fallback upload:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();