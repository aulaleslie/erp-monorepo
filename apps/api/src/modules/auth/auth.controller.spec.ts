import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import type { RequestWithUser } from '../../common/types/request';

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
      const setCookie = jest.fn();
      const mockReply = {
        setCookie,
      } as unknown as FastifyReply;

      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.login as jest.Mock).mockReturnValue({
        access_token: 'jwt-token',
      });

      const result = await controller.login(
        { email: 'test@test.com', password: 'password' },
        mockReply,
      );

      expect(result).toEqual({ message: 'Logged in successfully' });
      expect(setCookie).toHaveBeenCalledWith(
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
    it('should clear cookies and return success message', () => {
      const clearCookie = jest.fn();
      const mockReply = {
        clearCookie,
      } as unknown as FastifyReply;

      const result = controller.logout(mockReply);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(clearCookie).toHaveBeenCalledWith('access_token', {
        path: '/',
      });
      expect(clearCookie).toHaveBeenCalledWith('active_tenant', {
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

      const mockRequest = {
        user: { id: 'user-1' },
      } as unknown as RequestWithUser;
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

      const mockRequest = {
        user: { id: 'user-1' },
      } as unknown as RequestWithUser;
      await expect(controller.getProfile(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
