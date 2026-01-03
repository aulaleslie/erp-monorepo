import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { FastifyReply } from 'fastify';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      findUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should return success message and set cookie on valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        isSuperAdmin: false,
      };
      const mockReply = {
        setCookie: jest.fn(),
      } as unknown as FastifyReply;

      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.login as jest.Mock).mockResolvedValue({
        access_token: 'jwt-token',
      });

      const result = await controller.login(
        { email: 'test@test.com', password: 'password' },
        mockReply,
      );

      expect(result).toEqual({ message: 'Logged in successfully' });
      expect(mockReply.setCookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-token',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
        }),
      );
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const mockReply = {} as FastifyReply;
      (authService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        controller.login(
          { email: 'test@test.com', password: 'wrong' },
          mockReply,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear cookies and return success message', async () => {
      const mockReply = {
        clearCookie: jest.fn(),
      } as unknown as FastifyReply;

      const result = await controller.logout(mockReply);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockReply.clearCookie).toHaveBeenCalledWith('access_token', {
        path: '/',
      });
      expect(mockReply.clearCookie).toHaveBeenCalledWith('active_tenant', {
        path: '/',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@test.com',
        fullName: 'Test User',
        isSuperAdmin: false,
      };
      (authService.findUserById as jest.Mock).mockResolvedValue(mockUser);

      const mockRequest = { user: { id: 'user-1' } };
      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@test.com',
        fullName: 'Test User',
        isSuperAdmin: false,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (authService.findUserById as jest.Mock).mockResolvedValue(null);

      const mockRequest = { user: { id: 'user-1' } };
      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
