import { supabase } from '@/lib/supabase';

class StorageService {
  private bucketName = 'clothes-images';

  async uploadImage(uri: string, fileName: string): Promise<string> {
    try {
      console.log('🔄 Starting image upload:', { uri, fileName });
      
      // For web platform, handle differently
      if (typeof window !== 'undefined') {
        // Web platform - convert URI to blob
        const response = await fetch(uri);
        const blob = await response.blob();
        
        console.log('📦 Blob created:', { size: blob.size, type: blob.type });
        
        const { data, error } = await supabase.storage
          .from(this.bucketName)
          .upload(fileName, blob, {
            contentType: blob.type || 'image/jpeg',
            upsert: true
          });

        if (error) {
          console.error('❌ Upload error:', error);
          
          // Handle specific bucket not found error
          if (error.message.includes('Bucket not found') || error.message.includes('bucket') || error.message.includes('404')) {
            throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas dans votre projet Supabase.

Pour résoudre ce problème :
1. Connectez-vous à votre tableau de bord Supabase
2. Allez dans la section "Storage" 
3. Cliquez sur "New bucket"
4. Créez un bucket nommé exactement : "${this.bucketName}"
5. Configurez-le comme "Public bucket" pour permettre l'accès aux images
6. Définissez une limite de taille de fichier (recommandé : 5MB)
7. Autorisez les types MIME : image/jpeg, image/png, image/webp

Une fois le bucket créé, réessayez d'ajouter votre vêtement.`);
          }
          
          throw new Error(`Erreur lors du téléchargement: ${error.message}`);
        }

        console.log('✅ Upload successful:', data);

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(data.path);

        console.log('🔗 Public URL generated:', publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      } else {
        // Mobile platform - handle as before
        const response = await fetch(uri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        const { data, error } = await supabase.storage
          .from(this.bucketName)
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (error) {
          console.error('❌ Upload error:', error);
          
          // Handle specific bucket not found error
          if (error.message.includes('Bucket not found') || error.message.includes('bucket') || error.message.includes('404')) {
            throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas dans votre projet Supabase.

Pour résoudre ce problème :
1. Connectez-vous à votre tableau de bord Supabase
2. Allez dans la section "Storage" 
3. Cliquez sur "New bucket"
4. Créez un bucket nommé exactement : "${this.bucketName}"
5. Configurez-le comme "Public bucket" pour permettre l'accès aux images
6. Définissez une limite de taille de fichier (recommandé : 5MB)
7. Autorisez les types MIME : image/jpeg, image/png, image/webp

Une fois le bucket créé, réessayez d'ajouter votre vêtement.`);
          }
          
          throw new Error(`Erreur lors du téléchargement: ${error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
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
}

export const storageService = new StorageService();