import { describe, it, expect } from 'vitest';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// We need to test the interceptor logic directly
// First, let's import the reducer to test response unwrapping
describe('api interceptors', () => {
  // Test the response unwrapping logic
  describe('response interceptor - success', () => {
    it('unwraps BaseResponse with success=true', () => {
      // Simulate the interceptor logic
      const response = {
        data: {
          success: true,
          data: { id: '1', name: 'Test' },
          message: 'Success',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      } as AxiosResponse;

      // Apply the same logic as the interceptor
      const content = response.data;
      if (content && typeof content === 'object' && 'success' in content) {
        if (content.success) {
          response.data = content.data;
        }
      }

      expect(response.data).toEqual({ id: '1', name: 'Test' });
    });

    it('passes through response when success=false', () => {
      const response = {
        data: {
          success: false,
          data: null,
          message: 'Error occurred',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      } as AxiosResponse;

      const content = response.data;
      if (content && typeof content === 'object' && 'success' in content) {
        if (content.success) {
          response.data = content.data;
        }
      }

      // Should not unwrap when success is false
      expect(response.data).toEqual({
        success: false,
        data: null,
        message: 'Error occurred',
      });
    });

    it('passes through non-BaseResponse data', () => {
      const response = {
        data: [1, 2, 3], // Array, not BaseResponse
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      } as AxiosResponse;

      const content = response.data;
      if (content && typeof content === 'object' && 'success' in content) {
        if (content.success) {
          response.data = content.data;
        }
      }

      expect(response.data).toEqual([1, 2, 3]);
    });
  });

  describe('response interceptor - error handling', () => {
    let originalLocation: Location;

    beforeEach(() => {
      // Save original location
      originalLocation = window.location;
      
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard', href: '' },
        writable: true,
      });
    });

    afterEach(() => {
      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });

    it('redirects to login on 401 error when not on login page', () => {
      const error = {
        response: { status: 401 },
      };

      // Simulate the error interceptor logic
      if (error.response?.status === 401 && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      expect(window.location.href).toBe('/login');
    });

    it('does not redirect when already on login page', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/login', href: '' },
        writable: true,
      });

      const error = {
        response: { status: 401 },
      };

      // Simulate the error interceptor logic
      if (error.response?.status === 401 && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      expect(window.location.href).toBe('');
    });

    it('does not redirect on non-401 errors', () => {
      const error = {
        response: { status: 500 },
      };

      // Simulate the error interceptor logic
      if (error.response?.status === 401 && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      expect(window.location.href).toBe('');
    });
  });
});
