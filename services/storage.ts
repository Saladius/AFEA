import { supabase } from '@/lib/supabase';

class StorageService {
  private bucketName = 'clothes-images';

  async uploadImage(uri: string, fileName: string): Promise<string> {
    try {
      console.log('🔄 Starting image upload:', { uri, fileName });
      
      // Check if bucket exists first
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('❌ Error listing buckets:', bucketsError);
        throw new Error(`Erreur lors de la vérification des buckets: ${bucketsError.message}`);
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        console.error('❌ Bucket not found:', this.bucketName);
        throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas. Veuillez créer ce bucket dans votre tableau de bord Supabase (Storage > Nouveau bucket > "${this.bucketName}").`);
      }

      console.log('✅ Bucket exists, proceeding with upload');
      
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
          if (error.message.includes('Bucket not found')) {
            throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas. Veuillez créer ce bucket dans votre tableau de bord Supabase.`);
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
          if (error.message.includes('Bucket not found')) {
            throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas. Veuillez créer ce bucket dans votre tableau de bord Supabase.`);
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

  // Helper method to create bucket if it doesn't exist (for development)
  async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        throw bucketsError;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        console.log('🔧 Creating bucket:', this.bucketName);
        const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });

        if (createError) {
          console.error('❌ Error creating bucket:', createError);
          throw createError;
        }

        console.log('✅ Bucket created successfully');
      }
    } catch (error) {
      console.error('❌ Error ensuring bucket exists:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();