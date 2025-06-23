import { supabase } from '@/lib/supabase';

class StorageService {
  private bucketName = 'clothes-images';

  async uploadImage(uri: string, fileName: string): Promise<string> {
    try {
      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create array buffer from blob
      const arrayBuffer = await blob.arrayBuffer();

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(fileName: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
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
}

export const storageService = new StorageService();