import axios from 'axios';
import { BaseResponse } from '@gym-monorepo/shared';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
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
        // If success is false, it should probably be an error, but let's just pass it through
        // or reject promise?
        // Usually 200 OK means success in HTTP, but logical error in body?
        // NestJS interceptor returns 200 OK.
    }
    return response;
  },
  (error) => {
    // Handle global errors here (e.g. 401 redirect to login)
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
