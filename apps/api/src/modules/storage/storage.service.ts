import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_MIME_TYPES,
  AllowedImageMimeType,
} from './storage.constants';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');

    // Only initialize if MinIO is configured
    if (endpoint) {
      const [host, portStr] = endpoint.split(':');
      const port = portStr ? parseInt(portStr, 10) : 9000;
      const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

      this.minioClient = new Minio.Client({
        endPoint: host,
        port,
        useSSL,
        accessKey:
          this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
        secretKey:
          this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
      });

      this.bucket =
        this.configService.get<string>('MINIO_BUCKET') || 'gym-assets';
      this.publicUrl =
        this.configService.get<string>('MINIO_PUBLIC_URL') ||
        `http://${endpoint}`;
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.minioClient) {
      await this.ensureBucketExists();
    } else {
      this.logger.warn(
        'MinIO is not configured. Storage features will be unavailable.',
      );
    }
  }

  /**
   * Ensure the configured bucket exists, create if not
   */
  async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket);
        this.logger.log(`Created bucket: ${this.bucket}`);
      } else {
        this.logger.log(`Bucket exists: ${this.bucket}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to ensure bucket exists: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Validate file type and size before upload
   */
  validateFile(mimeType: string, size: number): void {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedImageMimeType)) {
      throw new BadRequestException(
        `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
      );
    }

    if (size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size ${size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (1MB)`,
      );
    }
  }

  /**
   * Generate a unique object key with prefix
   */
  generateObjectKey(prefix: string, originalFilename: string): string {
    const extension = originalFilename.split('.').pop() || 'bin';
    const uuid = randomUUID();
    return `${prefix}/${uuid}.${extension}`;
  }

  /**
   * Upload a file to MinIO
   * @returns The public URL of the uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    objectKey: string,
    mimeType: string,
    size: number,
  ): Promise<string> {
    this.validateFile(mimeType, size);

    if (!this.minioClient) {
      throw new BadRequestException('Storage service is not configured');
    }

    await this.minioClient.putObject(this.bucket, objectKey, buffer, size, {
      'Content-Type': mimeType,
    });

    return this.getPublicUrl(objectKey);
  }

  /**
   * Delete a file from MinIO
   */
  async deleteFile(objectKey: string): Promise<void> {
    if (!this.minioClient) {
      throw new BadRequestException('Storage service is not configured');
    }

    await this.minioClient.removeObject(this.bucket, objectKey);
  }

  /**
   * Retrieve a file from MinIO
   */
  async getFile(objectKey: string): Promise<Buffer> {
    if (!this.minioClient) {
      throw new BadRequestException('Storage service is not configured');
    }

    const stream = await this.minioClient.getObject(this.bucket, objectKey);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer | Uint8Array | string) => {
        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        chunks.push(data);
      });
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Get the public URL for an object
   */
  getPublicUrl(objectKey: string): string {
    return `${this.publicUrl}/${this.bucket}/${objectKey}`;
  }

  /**
   * Check if storage is configured and available
   */
  isConfigured(): boolean {
    return !!this.minioClient;
  }

  /**
   * Download an image from a URL, validate it, and store in MinIO
   * @param url The URL to download the image from
   * @param keyPrefix Prefix for the object key (e.g., 'items/tenant-123')
   * @param timeoutMs Timeout in milliseconds (default 30000)
   * @returns Object with imageKey, imageUrl, imageMimeType, imageSize
   */
  async downloadAndStoreFromUrl(
    url: string,
    keyPrefix: string,
    timeoutMs = 30000,
  ): Promise<{
    imageKey: string;
    imageUrl: string;
    imageMimeType: string;
    imageSize: number;
  }> {
    if (!this.minioClient) {
      throw new BadRequestException('Storage service is not configured');
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'gym-monorepo-import/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new BadRequestException(
          `Failed to download image: HTTP ${response.status}`,
        );
      }

      // Check content-type from headers
      const contentType = response.headers.get('content-type')?.split(';')[0];
      if (
        !contentType ||
        !ALLOWED_IMAGE_MIME_TYPES.includes(contentType as AllowedImageMimeType)
      ) {
        throw new BadRequestException(
          `Invalid image type: ${contentType}. Allowed types: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`,
        );
      }

      // Read response as buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const size = buffer.length;

      // Validate file size
      if (size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `Downloaded image size ${size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes (1MB)`,
        );
      }

      // Get filename from URL or use generic name
      const urlPath = new URL(url).pathname;
      const originalFilename =
        urlPath.split('/').pop() || `image.${contentType.split('/')[1]}`;

      // Generate object key and upload
      const objectKey = this.generateObjectKey(keyPrefix, originalFilename);
      const imageUrl = await this.uploadFile(
        buffer,
        objectKey,
        contentType,
        size,
      );

      return {
        imageKey: objectKey,
        imageUrl,
        imageMimeType: contentType,
        imageSize: size,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadRequestException(
          `Image download timed out after ${timeoutMs}ms`,
        );
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      const errorMessage = getErrorMessage(error);
      throw new BadRequestException(
        `Failed to download image from URL: ${errorMessage}`,
      );
    }
  }
}
