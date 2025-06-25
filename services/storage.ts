import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

class StorageService {
  private bucketName = 'clothes-images';

  async uploadImage(uri: string, fileName: string, mimeType?: string): Promise<string> {
    try {
      console.log('🔄 CLIENT: Starting image upload:', { 
        uri, 
        fileName, 
        mimeType, 
        platform: Platform.OS 
      });
      
      // Validate and determine content type
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const contentType = mimeType || 'image/jpeg';
      
      if (!supportedTypes.includes(contentType)) {
        console.error('❌ CLIENT ERROR: Unsupported content type:', contentType);
        throw new Error(`Format d'image non supporté: ${contentType}. Formats acceptés: JPEG, PNG, WebP.`);
      }
      
      console.log('📤 CLIENT: Using validated content type:', contentType);

      // Use different upload methods based on platform
      if (Platform.OS === 'web') {
        return await this.uploadImageWeb(uri, fileName, contentType);
      } else {
        // For mobile platforms (iOS/Android), use the Supabase client directly
        return await this.uploadImageMobile(uri, fileName, contentType);
      }

    } catch (error) {
      console.error('❌ CLIENT ERROR: Error uploading image:', error);
      throw error;
    }
  }

  // Web-specific upload using fetch
  private async uploadImageWeb(uri: string, fileName: string, contentType: string): Promise<string> {
    try {
      console.log('🌐 CLIENT: Using web upload method');
      
      // Convert URI to blob for web
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log('📤 CLIENT: Blob details:', { 
        size: blob.size, 
        type: blob.type,
        expectedType: contentType 
      });
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, blob, {
          contentType: contentType,
          upsert: true
        });

      if (error) {
        console.error('❌ SERVER ERROR: Web upload error:', error);
        throw this.handleStorageError(error);
      }

      console.log('✅ CLIENT: Web upload successful:', data);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log('🔗 CLIENT: Public URL generated:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('❌ CLIENT ERROR: Web upload failed:', error);
      throw error;
    }
  }

  // Mobile-specific upload (iOS/Android)
  private async uploadImageMobile(uri: string, fileName: string, contentType: string): Promise<string> {
    try {
      console.log('📱 CLIENT: Using mobile upload method for platform:', Platform.OS);
      
      // For mobile, we need to convert the URI to a format that Supabase can handle
      let fileData: any;
      
      if (Platform.OS === 'android') {
        // Android-specific handling
        console.log('🤖 CLIENT: Android-specific upload handling');
        
        // Use fetch to get the file data as ArrayBuffer for Android
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        fileData = arrayBuffer;
        
        console.log('📤 CLIENT: Android file data prepared:', { 
          size: arrayBuffer.byteLength,
          type: 'ArrayBuffer'
        });
        
      } else {
        // iOS handling - can use blob
        console.log('🍎 CLIENT: iOS-specific upload handling');
        
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        fileData = blob;
        
        console.log('📤 CLIENT: iOS file data prepared:', { 
          size: blob.size,
          type: blob.type || contentType
        });
      }

      // Upload using Supabase client
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, fileData, {
          contentType: contentType,
          upsert: true
        });

      if (error) {
        console.error('❌ SERVER ERROR: Mobile upload error:', error);
        throw this.handleStorageError(error);
      }

      console.log('✅ CLIENT: Mobile upload successful:', data);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log('🔗 CLIENT: Public URL generated:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('❌ CLIENT ERROR: Mobile upload failed:', error);
      throw error;
    }
  }

  // Centralized error handling for storage errors
  private handleStorageError(error: any): Error {
    console.error('🔍 CLIENT: Analyzing storage error:', error);
    
    if (error.message.includes('Bucket not found') || error.message.includes('bucket') || error.message.includes('404')) {
      console.error('❌ SERVER ERROR: Bucket not found');
      return new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas dans votre projet Supabase.

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
10. Configurez les politiques RLS (voir README.md section "Storage Setup")
11. Réessayez d'ajouter votre vêtement

Une fois le bucket créé manuellement, l'application fonctionnera correctement.`);
    }
    
    if (error.message.includes('row-level security') || 
        error.message.includes('policy') || 
        error.message.includes('RLS') ||
        error.message.includes('Unauthorized') ||
        error.message.includes('403')) {
      console.error('❌ SERVER ERROR: RLS policy violation');
      return new Error(`Erreur d'autorisation : Les politiques de sécurité (RLS) ne sont pas configurées correctement.

🔧 SOLUTION REQUISE :
1. Allez sur votre tableau de bord Supabase : https://supabase.com/dashboard
2. Naviguez vers Storage → ${this.bucketName} → Policies
3. Créez une politique INSERT avec l'expression :
   (bucket_id = '${this.bucketName}'::text AND auth.role() = 'authenticated'::text)
4. Créez une politique SELECT avec l'expression :
   bucket_id = '${this.bucketName}'::text
5. Créez une politique DELETE avec l'expression :
   (bucket_id = '${this.bucketName}'::text AND auth.role() = 'authenticated'::text)

Voir le README.md section "Storage Setup" pour les instructions détaillées.

IMPORTANT: Cette erreur indique que votre bucket existe mais n'a pas les bonnes politiques RLS configurées pour permettre aux utilisateurs authentifiés de télécharger des fichiers.`);
    }
    
    if (error.message.includes('Invalid file type') || error.message.includes('file type')) {
      console.error('❌ SERVER ERROR: Invalid file type');
      return new Error(`Type de fichier invalide côté serveur. Seuls les formats JPEG, PNG et WebP sont acceptés.`);
    }
    
    if (error.message.includes('File size') || error.message.includes('too large') || error.message.includes('413')) {
      console.error('❌ SERVER ERROR: File too large');
      return new Error(`Fichier trop volumineux. La taille maximale autorisée est de 5MB.`);
    }
    
    if (error.message.includes('Network request failed') || error.message.includes('network')) {
      console.error('❌ SERVER ERROR: Network request failed');
      return new Error(`Erreur de réseau lors du téléchargement. Vérifiez votre connexion internet et la configuration Supabase.

Si le problème persiste, vérifiez que :
1. Votre URL Supabase est correcte dans .env
2. Votre clé anonyme Supabase est valide
3. Les politiques RLS sont configurées (voir README.md section "Storage Setup")
4. Votre connexion internet est stable

Platform: ${Platform.OS}`);
    }
    
    if (error.message.includes('415')) {
      console.error('❌ SERVER ERROR: Unsupported media type');
      return new Error(`Type de média non supporté par le serveur. Seuls les formats JPEG, PNG et WebP sont acceptés.`);
    }
    
    // Generic error
    console.error('❌ SERVER ERROR: Generic storage error');
    return new Error(`Erreur serveur lors du téléchargement: ${error.message}

Platform: ${Platform.OS}
Bucket: ${this.bucketName}

Si cette erreur persiste, vérifiez :
1. La configuration de votre bucket Supabase
2. Les politiques RLS (voir README.md section "Storage Setup")
3. Votre connexion internet
4. Les logs de votre projet Supabase pour plus de détails`);
  }

  async deleteImage(fileName: string): Promise<void> {
    try {
      console.log('🗑️ CLIENT: Deleting image:', fileName);
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        console.error('❌ SERVER ERROR: Delete error:', error);
        if (error.message.includes('Bucket not found')) {
          throw new Error(`Le bucket de stockage "${this.bucketName}" n'existe pas.`);
        }
        throw error;
      }
      
      console.log('✅ CLIENT: Image deleted successfully');
    } catch (error) {
      console.error('❌ CLIENT ERROR: Error deleting image:', error);
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
      console.log('🔍 CLIENT: Checking if bucket exists');
      
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ CLIENT ERROR: Error listing buckets:', error);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName) || false;
      console.log('📊 CLIENT: Bucket exists:', bucketExists);
      
      return bucketExists;
    } catch (error) {
      console.error('❌ CLIENT ERROR: Error checking bucket existence:', error);
      return false;
    }
  }

  // Method to validate file before upload
  validateFile(uri: string, mimeType?: string, fileSize?: number): { valid: boolean; error?: string } {
    console.log('🔍 CLIENT: Validating file:', { uri, mimeType, fileSize, platform: Platform.OS });
    
    // Check file type
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const contentType = mimeType || 'image/jpeg';
    
    if (!supportedTypes.includes(contentType)) {
      return {
        valid: false,
        error: `Format d'image non supporté: ${contentType}. Formats acceptés: JPEG, PNG, WebP.`
      };
    }
    
    // Check file size (5MB limit)
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      return {
        valid: false,
        error: 'Fichier trop volumineux. La taille maximale autorisée est de 5MB.'
      };
    }
    
    // Check URI format
    if (!uri || uri.trim() === '') {
      return {
        valid: false,
        error: 'URI de fichier invalide.'
      };
    }
    
    console.log('✅ CLIENT: File validation passed');
    return { valid: true };
  }
}

export const storageService = new StorageService();