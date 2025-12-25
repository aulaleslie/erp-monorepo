/**
 * Validation utilities for consistent error handling across services
 */

import { BadRequestException } from '@nestjs/common';

/**
 * Builder class for collecting validation errors and throwing them in a consistent format
 */
export class ValidationErrorBuilder {
  private errors: Record<string, string[]> = {};

  /**
   * Add an error message for a field
   * @param field - Field name
   * @param message - Error message
   */
  addError(field: string, message: string): this {
    if (!this.errors[field]) {
      this.errors[field] = [];
    }
    this.errors[field].push(message);
    return this;
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  /**
   * Get all collected errors
   */
  getErrors(): Record<string, string[]> {
    return this.errors;
  }

  /**
   * Throw a BadRequestException if there are any errors
   */
  throwIfErrors(): void {
    if (this.hasErrors()) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.errors,
      });
    }
  }

  /**
   * Clear all errors
   */
  clear(): this {
    this.errors = {};
    return this;
  }
}

/**
 * Factory function to create a new ValidationErrorBuilder
 */
export function createValidationBuilder(): ValidationErrorBuilder {
  return new ValidationErrorBuilder();
}
