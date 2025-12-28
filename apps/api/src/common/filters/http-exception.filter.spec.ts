import { HttpExceptionFilter } from './http-exception.filter';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<FastifyReply>;
  let mockRequest: Partial<FastifyRequest>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    mockRequest = {
      url: '/test',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  describe('catch', () => {
    it('should handle basic HttpException', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
      });
    });

    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
      });
    });

    it('should handle ForbiddenException', () => {
      const exception = new ForbiddenException('Access denied');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied',
      });
    });

    it('should handle BadRequestException with validation errors', () => {
      const exception = new BadRequestException({
        message: 'Validation failed',
        errors: {
          email: ['Email is invalid'],
          password: ['Password is too short'],
        },
      });

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: {
          email: ['Email is invalid'],
          password: ['Password is too short'],
        },
      });
    });

    it('should handle BadRequestException with default message when errors present', () => {
      const exception = new BadRequestException({
        errors: {
          name: ['Name is required'],
        },
      });

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errors: {
            name: ['Name is required'],
          },
        }),
      );
    });

    it('should handle plain BadRequestException', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input',
      });
    });
  });
});
