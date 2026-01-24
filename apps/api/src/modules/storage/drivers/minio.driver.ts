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

      // Always ensure the bucket has a public read policy so that images can be viewed
      await this.setBucketPolicyToPublic();
    } catch (error) {
      this.logger.error(
        `Failed to ensure bucket exists: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  private async setBucketPolicyToPublic(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetBucketLocation', 's3:ListBucket'],
          Resource: [`arn:aws:s3:::${this.bucket}`],
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };

    try {
      await this.minioClient.setBucketPolicy(
        this.bucket,
        JSON.stringify(policy),
      );
      this.logger.log(`Set public read policy for bucket: ${this.bucket}`);
    } catch (error) {
      this.logger.error(
        `Failed to set bucket policy: ${getErrorMessage(error)}`,
      );
      // We don't throw here to avoid blocking startup if policy setting fails
      // but the bucket exists and is functional for other operations
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

  async exists(objectKey: string): Promise<boolean> {
    if (!this.minioClient) {
      return false;
    }

    try {
      await this.minioClient.statObject(this.bucket, objectKey);
      return true;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error.code === 'NotFound' || error.code === 'NoSuchKey')
      ) {
        return false;
      }
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.minioClient;
  }
}
