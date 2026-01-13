import { Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { IStorageDriver } from './storage.driver.interface';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class MinioStorageDriver implements IStorageDriver {
  private readonly logger = new Logger(MinioStorageDriver.name);
  private minioClient: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');

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

  async uploadFile(
    buffer: Buffer,
    objectKey: string,
    mimeType: string,
    size: number,
  ): Promise<string> {
    if (!this.minioClient) {
      throw new BadRequestException('Storage service is not configured');
    }

    await this.minioClient.putObject(this.bucket, objectKey, buffer, size, {
      'Content-Type': mimeType,
    });

    return this.getPublicUrl(objectKey);
  }

  async deleteFile(objectKey: string): Promise<void> {
    if (!this.minioClient) {
      throw new BadRequestException('Storage service is not configured');
    }

    await this.minioClient.removeObject(this.bucket, objectKey);
  }

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

  getPublicUrl(objectKey: string): string {
    return `${this.publicUrl}/${this.bucket}/${objectKey}`;
  }

  isConfigured(): boolean {
    return !!this.minioClient;
  }
}
