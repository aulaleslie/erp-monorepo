import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../database/entities';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findOneByEmail'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    // Mock UsersService
    usersService = {
      findOneByEmail: jest.fn(),
    };

    // Mock JwtService
    jwtService = {
      sign: jest.fn().mockReturnValue('mock_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user result if validation succeeds', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isSuperAdmin: false,
      } as UserEntity;

      usersService.findOneByEmail.mockResolvedValue(mockUser);
      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<Promise<boolean>, [string, string]>;
      compareSpy.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        isSuperAdmin: false,
      });
    });

    it('should return null if user not found', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password mismatch', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      } as UserEntity;

      usersService.findOneByEmail.mockResolvedValue(mockUser);
      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<Promise<boolean>, [string, string]>;
      compareSpy.mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrong_password',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        isSuperAdmin: false,
      };

      const result = service.login(user);

      expect(result).toHaveProperty('access_token', 'mock_token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      });
    });
  });
});
