import { useState, useCallback } from 'react';

/**
 * Validator function type
 * Returns error message if invalid, undefined/null if valid
 */
export type Validator<T> = (value: T[keyof T], formData: T) => string | undefined | null;

/**
 * Validator configuration for form fields
 */
export type ValidatorConfig<T> = {
  [K in keyof T]?: Validator<T>[];
};

/**
 * Form validation errors
 */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Hook for managing form validation state
 * @param validators - Configuration of validators for each field
 */
export function useFormValidation<T extends Record<string, any>>(
  validators: ValidatorConfig<T>
) {
  const [errors, setErrors] = useState<FormErrors<T>>({});

  /**
   * Validate all fields and return whether form is valid
   */
  const validate = useCallback(
    (formData: T): boolean => {
      const newErrors: FormErrors<T> = {};

      for (const field of Object.keys(validators) as (keyof T)[]) {
        const fieldValidators = validators[field];
        if (!fieldValidators) continue;

        for (const validator of fieldValidators) {
          const error = validator(formData[field], formData);
          if (error) {
            newErrors[field] = error;
            break; // Stop at first error for this field
          }
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [validators]
  );

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof T, formData: T): boolean => {
      const fieldValidators = validators[field];
      if (!fieldValidators) return true;

      for (const validator of fieldValidators) {
        const error = validator(formData[field], formData);
        if (error) {
          setErrors((prev) => ({ ...prev, [field]: error }));
          return false;
        }
      }

      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return true;
    },
    [validators]
  );

  /**
   * Clear error for a specific field
   */
  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * Set error for a specific field (e.g., from API response)
   */
  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearError,
    setFieldError,
    clearAllErrors,
  };
}

// Common validators
export const validators = {
  required: (message = 'This field is required') => 
    (value: any) => !value || (typeof value === 'string' && !value.trim()) ? message : undefined,
  
  email: (message = 'Please enter a valid email') =>
    (value: any) => value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? message : undefined,
  
  minLength: (length: number, message?: string) =>
    (value: any) => value && value.length < length 
      ? message || `Must be at least ${length} characters` 
      : undefined,
  
  maxLength: (length: number, message?: string) =>
    (value: any) => value && value.length > length 
      ? message || `Must be at most ${length} characters` 
      : undefined,
  
  match: <T>(field: keyof T, message = 'Fields do not match') =>
    (value: any, formData: T) => value !== formData[field] ? message : undefined,
};
