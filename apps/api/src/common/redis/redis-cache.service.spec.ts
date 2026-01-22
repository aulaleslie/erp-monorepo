import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from './redis-cache.service';
import Redis from 'ioredis';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let redis: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: 'REDIS_CLIENT',
          useValue: {
            get: jest.fn(),
            setex: jest.fn(),
            del: jest.fn(),
            keys: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    redis = module.get('REDIS_CLIENT');
  });

  describe('get', () => {
    it('should return parsed JSON on cache hit', async () => {
      const mockData = { id: '1', name: 'Test' };
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(mockData));

      const result = await service.get('test-key');

      expect(result).toEqual(mockData);
      expect(redis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null on cache miss', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });

    it('should return null and log error on JSON parse failure', async () => {
      (redis.get as jest.Mock).mockResolvedValue('invalid-json');

      const result = await service.get('test-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should call setex with serialized value and ttl', async () => {
      const mockData = { id: '1' };
      await service.set('test-key', mockData, 300);

      expect(redis.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(mockData),
      );
    });
  });

  describe('del', () => {
    it('should call del with single key', async () => {
      await service.del('test-key');
      expect(redis.del).toHaveBeenCalledWith('test-key');
    });

    it('should call del with multiple keys', async () => {
      await service.del(['key1', 'key2']);
      expect(redis.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should not call del if array is empty', async () => {
      await service.del([]);
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('delByPattern', () => {
    it('should find keys and delete them', async () => {
      (redis.keys as jest.Mock).mockResolvedValue(['key1', 'key2']);
      await service.delByPattern('test:*');

      expect(redis.keys).toHaveBeenCalledWith('test:*');
      expect(redis.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should not call del if no keys found', async () => {
      (redis.keys as jest.Mock).mockResolvedValue([]);
      await service.delByPattern('test:*');

      expect(redis.del).not.toHaveBeenCalled();
    });
  });
});
