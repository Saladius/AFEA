import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';

class StorageService {
  private bucketName = 'clothes-images';

  async uploadImage(uri: string, fileName: string, mimeType?: string): Promise<string> {
    try {
      console.log('🔄 CLIENT: Starting image upload with FileSystem:', { uri, fileName, mimeType });
      
      // Get Supabase configuration
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ CLIENT ERROR: Missing Supabase configuration');
        throw new Error('Configuration Supabase manquante');
      }

      // Validate and determine content type
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const contentType = mimeType || 'image/jpeg';
      
      if (!supportedTypes.includes(contentType)) {
        console.error('❌ CLIENT ERROR: Unsupported content type:', contentType);
        throw new Error(`Format d'image non supporté: ${contentType}. Formats acceptés: JPEG, PNG, WebP.`);
      }
      
      console.log('📤 CLIENT: Using validated content type:', contentType);

      // Construct the upload URL
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${this.bucketName}/${fileName}`;
      
      console.log('📤 CLIENT: Upload URL:', uploadUrl);

      // Upload using FileSystem
      const result = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: 'POST',
        headers: {
          'Content-Type': contentType,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      console.log('📤 CLIENT: Upload result:', result);

      if (result.status !== 200) {
        console.error('❌ SERVER ERROR: Upload failed with status:', result.status);
        console.error('❌ SERVER ERROR: Response body:', result.body);
        
        // Handle specific error cases
        if (result.status === 404) {
          console.error('❌ SERVER ERROR: Bucket not found');
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
10. Configurez les politiques RLS (voir README.md section "Storage Setup")
11. Réessayez d'ajouter votre vêtement

Une fois le bucket créé manuellement, l'application fonctionnera correctement.`);
        } else if (result.status === 400) {
          console.error('❌ SERVER ERROR: Bad request - possible RLS policy violation or invalid image format');
          
          // Check if it's an RLS policy violation
          if (result.body && (result.body.includes('row-level security') || result.body.includes('Unauthorized') || result.body.includes('403'))) {
            throw new Error(`Erreur d'autorisation : Les politiques de sécurité (RLS) ne sont pas configurées correctement.

🔧 SOLUTION REQUISE :
1. Allez sur votre tableau de bord Supabase : https://supabase.com/dashboard
2. Naviguez vers Storage → ${this.bucketName} → Policies
3. Créez une politique INSERT avec l'expression :
   (bucket_id = '${this.bucketName}'::text AND auth.role() = 'authenticated'::text)
4. Créez une politique SELECT avec l'expression :
   bucket_id = '${this.bucketName}'::text
5. Créez une politique DELETE avec l'expression :
   (bucket_id = '${this.bucketName}'::text AND auth.role() = 'authenticated'::text)

Voir le README.md section "Storage Setup" pour les instructions détaillées.`);
          } else {
            throw new Error(`Erreur de format d'image côté serveur. Le fichier envoyé n'est pas reconnu comme une image valide (JPEG, PNG, WebP) ou est corrompu.`);
          }
        } else if (result.status === 413) {
          console.error('❌ SERVER ERROR: File too large');
          throw new Error(`Fichier trop volumineux. La taille maximale autorisée est de 5MB.`);
        } else if (result.status === 415) {
          console.error('❌ SERVER ERROR: Unsupported media type');
          throw new Error(`Type de média non supporté par le serveur. Seuls les formats JPEG, PNG et WebP sont acceptés.`);
        } else if (result.status === 403) {
          console.error('❌ SERVER ERROR: Forbidden - RLS policy violation');
          throw new Error(`Accès refusé : Les politiques de sécurité (RLS) ne permettent pas le téléchargement.

🔧 SOLUTION REQUISE :
1. Allez sur votre tableau de bord Supabase : https://supabase.com/dashboard
2. Naviguez vers Storage → ${this.bucketName} → Policies
3. Créez une politique INSERT pour les utilisateurs authentifiés
4. Voir le README.md section "Storage Setup" pour les instructions complètes

L'erreur indique que votre bucket existe mais n'a pas les bonnes politiques RLS configurées.`);
        }
        
        throw new Error(`Erreur serveur lors du téléchargement: ${result.status}. ${result.body || 'Aucun détail supplémentaire.'}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      console.log('🔗 CLIENT: Public URL generated:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('❌ CLIENT ERROR: Error uploading image:', error);
      // Try fallback method if primary upload fails
      console.log('🔄 CLIENT: Attempting fallback upload method...');
      try {
        return await this.uploadImageFallback(uri, fileName, mimeType);
      } catch (fallbackError) {
        console.error('❌ CLIENT ERROR: Fallback upload also failed:', fallbackError);
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
      console.log('🔄 CLIENT: Using fallback upload method');
      
      // Validate content type for fallback method too
      const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const contentType = mimeType || 'image/jpeg';
      
      if (!supportedTypes.includes(contentType)) {
        console.error('❌ CLIENT ERROR: Unsupported content type in fallback:', contentType);
        throw new Error(`Format d'image non supporté: ${contentType}. Formats acceptés: JPEG, PNG, WebP.`);
      }
      
      // Convert URI to blob for web or array buffer for mobile
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Validate blob type as well
      const finalContentType = contentType;
      if (blob.type && !supportedTypes.includes(blob.type)) {
        console.error('❌ CLIENT ERROR: Blob has unsupported type:', blob.type);
        throw new Error(`Le fichier sélectionné a un type non supporté: ${blob.type}. Formats acceptés: JPEG, PNG, WebP.`);
      }
      
      console.log('📤 CLIENT: Fallback using content type:', finalContentType);
      console.log('📤 CLIENT: Blob details:', { type: blob.type, size: blob.size });
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, blob, {
          contentType: finalContentType,
          upsert: true
        });

      if (error) {
        console.error('❌ SERVER ERROR: Fallback upload error:', error);
        
        if (error.message.includes('Bucket not found') || error.message.includes('bucket') || error.message.includes('404')) {
          console.error('❌ SERVER ERROR: Bucket not found in fallback');
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
10. Configurez les politiques RLS (voir README.md section "Storage Setup")
11. Réessayez d'ajouter votre vêtement

Une fois le bucket créé manuellement, l'application fonctionnera correctement.`);
        } else if (error.message.includes('row-level security') || error.message.includes('policy') || error.message.includes('RLS')) {
          console.error('❌ SERVER ERROR: RLS policy violation in fallback');
          throw new Error(`Erreur de politique de sécurité : Les politiques RLS ne sont pas configurées.

🔧 SOLUTION REQUISE :
1. Allez sur votre tableau de bord Supabase : https://supabase.com/dashboard
2. Naviguez vers Storage → ${this.bucketName} → Policies
3. Créez les politiques RLS nécessaires (voir README.md section "Storage Setup")
4. Assurez-vous que les utilisateurs authentifiés peuvent INSERT, SELECT et DELETE

Le bucket existe mais les politiques de sécurité empêchent le téléchargement.`);
        } else if (error.message.includes('Invalid file type') || error.message.includes('file type')) {
          console.error('❌ SERVER ERROR: Invalid file type in fallback');
          throw new Error(`Type de fichier invalide côté serveur. Seuls les formats JPEG, PNG et WebP sont acceptés.`);
        } else if (error.message.includes('File size') || error.message.includes('too large')) {
          console.error('❌ SERVER ERROR: File too large in fallback');
          throw new Error(`Fichier trop volumineux. La taille maximale autorisée est de 5MB.`);
        } else if (error.message.includes('Network request failed')) {
          console.error('❌ SERVER ERROR: Network request failed in fallback');
          throw new Error(`Erreur de réseau lors du téléchargement. Vérifiez votre connexion internet et la configuration Supabase.

Si le problème persiste, vérifiez que :
1. Votre URL Supabase est correcte dans .env
2. Votre clé anonyme Supabase est valide
3. Les politiques RLS sont configurées (voir README.md section "Storage Setup")`);
        }
        
        throw new Error(`Erreur serveur lors du téléchargement (fallback): ${error.message}`);
      }

      console.log('✅ CLIENT: Fallback upload successful:', data);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      console.log('🔗 CLIENT: Public URL generated:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('❌ CLIENT ERROR: Error in fallback upload:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();