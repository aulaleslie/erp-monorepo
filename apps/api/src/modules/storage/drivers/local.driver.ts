import { Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IStorageDriver } from './storage.driver.interface';

export class LocalStorageDriver implements IStorageDriver {
  private readonly logger = new Logger(LocalStorageDriver.name);
  private storagePath: string;
  private appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.storagePath =
      this.configService.get<string>('LOCAL_STORAGE_PATH') || './uploads';
    this.appUrl =
      this.configService.get<string>('APP_URL') || 'http://localhost:3001';
  }

  async onModuleInit(): Promise<void> {
    await this.ensureStoragePathExists(this.storagePath);
  }

  private async ensureStoragePathExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      this.logger.log(`Created local storage directory: ${dirPath}`);
    }
  }

  async uploadFile(
    buffer: Buffer,
    objectKey: string,
    _mimeType: string,
    _size: number,
  ): Promise<string> {
    const filePath = path.join(this.storagePath, objectKey);
    await this.ensureStoragePathExists(path.dirname(filePath));

    await fs.writeFile(filePath, buffer);

    return this.getPublicUrl(objectKey);
  }

  async deleteFile(objectKey: string): Promise<void> {
    const filePath = path.join(this.storagePath, objectKey);
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code !== 'ENOENT') {
        throw error;
      }
      this.logger.warn(`File not found for deletion: ${filePath}`);
    }
  }

  async getFile(objectKey: string): Promise<Buffer> {
    const filePath = path.join(this.storagePath, objectKey);
    try {
      return await fs.readFile(filePath);
    } catch (error: unknown) {
      const fsError = error as NodeJS.ErrnoException;
      if (fsError.code === 'ENOENT') {
        throw new BadRequestException('File not found');
      }
      throw error;
    }
  }

  getPublicUrl(objectKey: string): string {
    // Assuming we serve files from a generic route like /uploads/...
    // We can map mapping /uploads to the directory in main.ts or via a controller
    // For now, let's assume a controller will serve it via /api/storage/file/:key
    // Or if we use ServeStaticModule, we might serve it under /uploads
    // Let's use a standardized api endpoint for local storage retrieval to avoid static serving complexity if possible,
    // or just assume standard static file serving.
    // Given the request "some of them might only need local storage or disk path", static serving is simplest.
    // Let's assume we will configure /uploads to be static.
    return `${this.appUrl}/uploads/${objectKey}`;
  }

  isConfigured(): boolean {
    return true; // Local storage is always available if the FS works
  }
}
