import axios, { AxiosError } from 'axios';
import { BaseResponse } from '@gym-monorepo/shared';

/**
 * Pre-configured axios instance for API calls.
 * - Automatically includes credentials (cookies)
 * - Unwraps BaseResponse.data for successful responses
 * - Handles 401 redirects globally
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Raw axios instance that doesn't unwrap responses.
 * Useful for auth context where we need to handle responses manually.
 */
export const apiRaw = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    // If the response follows BaseResponse structure and is successful, return the inner data
    // But axios wraps everything in 'data' first.
    // So response.data is the BaseResponse.
    // response.data.data is the actual content.
    const content = response.data as BaseResponse;
    if (content && typeof content === 'object' && 'success' in content) {
        if (content.success) {
            // Modify response.data to be the inner data, to keep service layer clean
            response.data = content.data;
            return response;
        } 
    }
    return response;
  },
  (error) => {
    // Handle global errors here (e.g. 401 redirect to login)
    if (error.response?.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Type-safe error extraction from axios errors
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as BaseResponse;
    return data.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Extract field-level validation errors from axios error
 */
export function getApiFieldErrors(error: unknown): Record<string, string[]> | undefined {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as BaseResponse;
    return data.errors;
  }
  return undefined;
}
