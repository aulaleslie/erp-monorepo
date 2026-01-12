import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { MAX_FILE_SIZE, ALLOWED_IMAGE_MIME_TYPES } from './storage.constants';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('validateFile', () => {
    it('should accept valid image mime types', () => {
      for (const mimeType of ALLOWED_IMAGE_MIME_TYPES) {
        expect(() => service.validateFile(mimeType, 1000)).not.toThrow();
      }
    });

    it('should reject invalid mime types', () => {
      const invalidTypes = [
        'application/pdf',
        'text/plain',
        'video/mp4',
        'audio/mp3',
        'image/svg+xml',
      ];

      for (const mimeType of invalidTypes) {
        expect(() => service.validateFile(mimeType, 1000)).toThrow(
          BadRequestException,
        );
      }
    });

    it('should accept files under 1MB', () => {
      expect(() =>
        service.validateFile('image/png', MAX_FILE_SIZE - 1),
      ).not.toThrow();
      expect(() =>
        service.validateFile('image/png', MAX_FILE_SIZE),
      ).not.toThrow();
    });

    it('should reject files over 1MB', () => {
      expect(() =>
        service.validateFile('image/png', MAX_FILE_SIZE + 1),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateFile('image/png', MAX_FILE_SIZE * 2),
      ).toThrow(BadRequestException);
    });

    it('should include helpful error message for invalid type', () => {
      try {
        service.validateFile('application/pdf', 1000);
        fail('Should have thrown');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).toContain('Invalid file type');
        expect(message).toContain('application/pdf');
      }
    });

    it('should include helpful error message for size exceeded', () => {
      try {
        service.validateFile('image/png', MAX_FILE_SIZE + 1);
        fail('Should have thrown');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).toContain('exceeds maximum');
        expect(message).toContain('1MB');
      }
    });
  });

  describe('generateObjectKey', () => {
    it('should generate unique keys', () => {
      const key1 = service.generateObjectKey('items', 'photo.jpg');
      const key2 = service.generateObjectKey('items', 'photo.jpg');

      expect(key1).not.toEqual(key2);
    });

    it('should include prefix in key', () => {
      const key = service.generateObjectKey('items', 'photo.jpg');

      expect(key.startsWith('items/')).toBe(true);
    });

    it('should preserve file extension', () => {
      const jpgKey = service.generateObjectKey('items', 'photo.jpg');
      const pngKey = service.generateObjectKey('items', 'image.png');
      const webpKey = service.generateObjectKey('items', 'test.webp');

      expect(jpgKey.endsWith('.jpg')).toBe(true);
      expect(pngKey.endsWith('.png')).toBe(true);
      expect(webpKey.endsWith('.webp')).toBe(true);
    });

    it('should handle files without extension', () => {
      const key = service.generateObjectKey('items', 'noextension');

      expect(key).toContain('items/');
      expect(key.endsWith('.noextension')).toBe(true);
    });
  });

  describe('isConfigured', () => {
    it('should return false when MinIO is not configured', () => {
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('uploadFile', () => {
    it('should throw when storage is not configured', async () => {
      const buffer = Buffer.from('test');

      await expect(
        service.uploadFile(buffer, 'test/key.jpg', 'image/jpeg', buffer.length),
      ).rejects.toThrow('Storage service is not configured');
    });
  });

  describe('deleteFile', () => {
    it('should throw when storage is not configured', async () => {
      await expect(service.deleteFile('test/key.jpg')).rejects.toThrow(
        'Storage service is not configured',
      );
    });
  });

  describe('getFile', () => {
    it('should throw when storage is not configured', async () => {
      await expect(service.getFile('test/key.jpg')).rejects.toThrow(
        'Storage service is not configured',
      );
    });
  });

  describe('downloadAndStoreFromUrl', () => {
    it('should throw when storage is not configured', async () => {
      await expect(
        service.downloadAndStoreFromUrl(
          'https://example.com/image.jpg',
          'items/tenant-123',
        ),
      ).rejects.toThrow('Storage service is not configured');
    });
  });
});
