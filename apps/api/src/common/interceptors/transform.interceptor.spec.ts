import { TransformInterceptor } from './transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    const mockExecutionContext = {} as ExecutionContext;

    it('should wrap response data with success: true', (done) => {
      const responseData = { id: 1, name: 'Test' };
      const mockCallHandler: CallHandler = {
        handle: () => of(responseData),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({
            success: true,
            data: responseData,
          });
          done();
        },
      });
    });

    it('should handle null data', (done) => {
      const mockCallHandler: CallHandler = {
        handle: () => of(null),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({
            success: true,
            data: null,
          });
          done();
        },
      });
    });

    it('should handle array data', (done) => {
      const responseData = [{ id: 1 }, { id: 2 }];
      const mockCallHandler: CallHandler = {
        handle: () => of(responseData),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({
            success: true,
            data: responseData,
          });
          done();
        },
      });
    });

    it('should handle string data', (done) => {
      const responseData = 'Hello World';
      const mockCallHandler: CallHandler = {
        handle: () => of(responseData),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({
            success: true,
            data: 'Hello World',
          });
          done();
        },
      });
    });

    it('should handle undefined data', (done) => {
      const mockCallHandler: CallHandler = {
        handle: () => of(undefined),
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({
            success: true,
            data: undefined,
          });
          done();
        },
      });
    });
  });
});
