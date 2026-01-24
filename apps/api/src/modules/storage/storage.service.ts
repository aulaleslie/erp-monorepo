import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_MIME_TYPES,
  AllowedImageMimeType,
  ALLOWED_DOCUMENT_MIME_TYPES,
  AllowedDocumentMimeType,
} from './storage.constants';
import { IStorageDriver } from './drivers/storage.driver.interface';
import { MinioStorageDriver } from './drivers/minio.driver';
import { LocalStorageDriver } from './drivers/local.driver';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private driver: IStorageDriver;

  constructor(private readonly configService: ConfigService) {
    const driverType =
      this.configService.get<string>('STORAGE_DRIVER') || 'minio';

    this.logger.log(`Initializing StorageService with driver: ${driverType}`);

    if (driverType === 'local') {
      this.driver = new LocalStorageDriver(configService);
    } else {
      this.driver = new MinioStorageDriver(configService);
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.driver.onModuleInit) {
      await this.driver.onModuleInit();
    }

    if (
      !this.driver.isConfigured() &&
      this.configService.get<string>('STORAGE_DRIVER') !== 'local'
    ) {
      // Only warn for MinIO if it's not configured but was requested (or default).
      // Local driver is always "configured" technically, but MinIO relies on env vars.
      this.logger.warn(
        'Storage driver is not fully configured. Storage features may be unavailable.',
      );
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
   * Validate document type and size before upload
   */
  validateDocument(mimeType: string, size: number): void {
    if (
      !ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType as AllowedDocumentMimeType)
    ) {
      throw new BadRequestException(
        `Invalid file type: ${mimeType}. Allowed types: ${ALLOWED_DOCUMENT_MIME_TYPES.join(', ')}`,
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
   * Upload a file
   * @returns The public URL of the uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    objectKey: string,
    mimeType: string,
    size: number,
  ): Promise<string> {
    this.validateFile(mimeType, size);

    return this.driver.uploadFile(buffer, objectKey, mimeType, size);
  }

  /**
   * Upload a document
   * @returns The public URL of the uploaded document
   */
  async uploadDocument(
    buffer: Buffer,
    objectKey: string,
    mimeType: string,
    size: number,
  ): Promise<string> {
    this.validateDocument(mimeType, size);

    return this.driver.uploadFile(buffer, objectKey, mimeType, size);
  }

  /**
   * Delete a file
   */
  async deleteFile(objectKey: string): Promise<void> {
    return this.driver.deleteFile(objectKey);
  }

  /**
   * Retrieve a file
   */
  async getFile(objectKey: string): Promise<Buffer> {
    return this.driver.getFile(objectKey);
  }

  /**
   * Get the public URL for an object
   */
  getPublicUrl(objectKey: string): string {
    return this.driver.getPublicUrl(objectKey);
  }

  /**
   * Check if an object exists in storage
   */
  async exists(objectKey: string): Promise<boolean> {
    return this.driver.exists(objectKey);
  }

  /**
   * Check if storage is configured and available
   */
  isConfigured(): boolean {
    return this.driver.isConfigured();
  }

  /**
   * Download an image from a URL, validate it, and store using the driver
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
    if (!this.driver.isConfigured()) {
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
