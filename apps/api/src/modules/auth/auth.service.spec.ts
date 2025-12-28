import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

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
      };

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        isSuperAdmin: false,
      });
    });

    it('should return null if user not found', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password mismatch', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      };

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await service.validateUser(
        'test@example.com',
        'wrong_password',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        isSuperAdmin: false,
      };

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token', 'mock_token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      });
    });
  });
});
