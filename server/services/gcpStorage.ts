// GCP Cloud Storage integration for CCTV recordings
import { Storage } from '@google-cloud/storage';

interface GCPConfig {
  projectId: string;
  keyFilename?: string;
  bucketName: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

class GCPStorageService {
  private storage: Storage;
  private bucketName: string;
  private isConfigured: boolean = false;

  constructor(config: GCPConfig) {
    try {
      this.storage = new Storage({
        projectId: config.projectId,
        keyFilename: config.keyFilename,
      });
      this.bucketName = config.bucketName;
      this.isConfigured = true;
      console.log('✅ GCP Storage service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize GCP Storage:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Upload a recording file to GCP Cloud Storage
   */
  async uploadRecording(
    localFilePath: string, 
    remoteFileName: string, 
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'GCP Storage not configured'
      };
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(`recordings/${remoteFileName}`);

      // Upload file with metadata
      await bucket.upload(localFilePath, {
        destination: `recordings/${remoteFileName}`,
        metadata: {
          metadata: {
            ...metadata,
            uploadedAt: new Date().toISOString(),
            contentType: 'video/mp4'
          }
        }
      });

      // Make file publicly accessible (optional)
      // await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/recordings/${remoteFileName}`;

      console.log(`✅ Recording uploaded to GCP: ${remoteFileName}`);
      
      return {
        success: true,
        url: publicUrl,
        fileName: remoteFileName
      };

    } catch (error) {
      console.error('❌ Failed to upload recording to GCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a recording from GCP Cloud Storage
   */
  async deleteRecording(fileName: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'GCP Storage not configured'
      };
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(`recordings/${fileName}`);

      await file.delete();

      console.log(`✅ Recording deleted from GCP: ${fileName}`);
      
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete recording from GCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * List all recordings in the bucket
   */
  async listRecordings(prefix: string = 'recordings/'): Promise<{
    success: boolean;
    files?: Array<{
      name: string;
      size: number;
      created: Date;
      updated: Date;
      url: string;
    }>;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'GCP Storage not configured'
      };
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({ prefix });

      const fileList = files.map(file => ({
        name: file.name,
        size: parseInt(file.metadata.size || '0'),
        created: new Date(file.metadata.timeCreated || ''),
        updated: new Date(file.metadata.updated || ''),
        url: `https://storage.googleapis.com/${this.bucketName}/${file.name}`
      }));

      return {
        success: true,
        files: fileList
      };

    } catch (error) {
      console.error('❌ Failed to list recordings from GCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get download URL for a recording (with expiration)
   */
  async getDownloadUrl(fileName: string, expirationMinutes: number = 60): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'GCP Storage not configured'
      };
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(`recordings/${fileName}`);

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expirationMinutes * 60 * 1000
      });

      return {
        success: true,
        url
      };

    } catch (error) {
      console.error('❌ Failed to get download URL from GCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if GCP Storage is configured and accessible
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'GCP Storage not configured'
      };
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.exists();
      
      if (!exists) {
        return {
          success: false,
          error: `Bucket '${this.bucketName}' does not exist`
        };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ GCP Storage connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    success: boolean;
    stats?: {
      totalFiles: number;
      totalSize: number;
      recordingsCount: number;
    };
    error?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'GCP Storage not configured'
      };
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({ prefix: 'recordings/' });

      let totalSize = 0;
      let recordingsCount = 0;

      for (const file of files) {
        const [metadata] = await file.getMetadata();
        totalSize += parseInt(metadata.size || '0');
        recordingsCount++;
      }

      return {
        success: true,
        stats: {
          totalFiles: files.length,
          totalSize,
          recordingsCount
        }
      };

    } catch (error) {
      console.error('❌ Failed to get storage stats from GCP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Default configuration (can be overridden with environment variables)
const defaultConfig: GCPConfig = {
  projectId: process.env.GCP_PROJECT_ID || 'matsplash-cctv',
  keyFilename: process.env.GCP_KEY_FILE || undefined,
  bucketName: process.env.GCP_BUCKET_NAME || 'matsplash-recordings'
};

// Create singleton instance
export const gcpStorage = new GCPStorageService(defaultConfig);

// Export types and class for external use
export { GCPStorageService, GCPConfig, UploadResult };
export default gcpStorage;
