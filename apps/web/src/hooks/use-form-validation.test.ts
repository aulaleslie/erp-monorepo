import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation, validators } from './use-form-validation';

describe('validators', () => {
  describe('required', () => {
    const requiredValidator = validators.required();

    it('returns error message for empty string', () => {
      expect(requiredValidator('')).toBe('This field is required');
    });

    it('returns error message for whitespace-only string', () => {
      expect(requiredValidator('   ')).toBe('This field is required');
    });

    it('returns error message for null', () => {
      expect(requiredValidator(null)).toBe('This field is required');
    });

    it('returns error message for undefined', () => {
      expect(requiredValidator(undefined)).toBe('This field is required');
    });

    it('returns undefined for valid string', () => {
      expect(requiredValidator('hello')).toBeUndefined();
    });

    it('returns undefined for number', () => {
      expect(requiredValidator(123)).toBeUndefined();
    });

    it('uses custom message when provided', () => {
      const customValidator = validators.required('Name is required');
      expect(customValidator('')).toBe('Name is required');
    });
  });

  describe('email', () => {
    const emailValidator = validators.email();

    it('returns undefined for valid email', () => {
      expect(emailValidator('test@example.com')).toBeUndefined();
    });

    it('returns undefined for empty value (use required for that)', () => {
      expect(emailValidator('')).toBeUndefined();
    });

    it('returns undefined for null value', () => {
      expect(emailValidator(null)).toBeUndefined();
    });

    it('returns error for invalid email without @', () => {
      expect(emailValidator('testexample.com')).toBe('Please enter a valid email');
    });

    it('returns error for invalid email without domain', () => {
      expect(emailValidator('test@')).toBe('Please enter a valid email');
    });

    it('returns error for invalid email with spaces', () => {
      expect(emailValidator('test @example.com')).toBe('Please enter a valid email');
    });

    it('uses custom message when provided', () => {
      const customValidator = validators.email('Invalid email format');
      expect(customValidator('invalid')).toBe('Invalid email format');
    });
  });

  describe('minLength', () => {
    const minLengthValidator = validators.minLength(5);

    it('returns undefined for string at min length', () => {
      expect(minLengthValidator('hello')).toBeUndefined();
    });

    it('returns undefined for string above min length', () => {
      expect(minLengthValidator('hello world')).toBeUndefined();
    });

    it('returns error for string below min length', () => {
      expect(minLengthValidator('hi')).toBe('Must be at least 5 characters');
    });

    it('returns undefined for empty value (use required for that)', () => {
      expect(minLengthValidator('')).toBeUndefined();
    });

    it('returns undefined for null value', () => {
      expect(minLengthValidator(null)).toBeUndefined();
    });

    it('uses custom message when provided', () => {
      const customValidator = validators.minLength(8, 'Password too short');
      expect(customValidator('short')).toBe('Password too short');
    });
  });

  describe('maxLength', () => {
    const maxLengthValidator = validators.maxLength(10);

    it('returns undefined for string at max length', () => {
      expect(maxLengthValidator('0123456789')).toBeUndefined();
    });

    it('returns undefined for string below max length', () => {
      expect(maxLengthValidator('hello')).toBeUndefined();
    });

    it('returns error for string above max length', () => {
      expect(maxLengthValidator('this is too long')).toBe('Must be at most 10 characters');
    });

    it('returns undefined for empty value', () => {
      expect(maxLengthValidator('')).toBeUndefined();
    });

    it('returns undefined for null value', () => {
      expect(maxLengthValidator(null)).toBeUndefined();
    });

    it('uses custom message when provided', () => {
      const customValidator = validators.maxLength(5, 'Too long!');
      expect(customValidator('hello world')).toBe('Too long!');
    });
  });

  describe('match', () => {
    interface TestForm {
      password: string;
      confirmPassword: string;
    }

    const matchValidator = validators.match<TestForm>('password');

    it('returns undefined when values match', () => {
      const formData: TestForm = { password: 'secret123', confirmPassword: 'secret123' };
      expect(matchValidator('secret123', formData)).toBeUndefined();
    });

    it('returns error when values do not match', () => {
      const formData: TestForm = { password: 'secret123', confirmPassword: 'different' };
      expect(matchValidator('different', formData)).toBe('Fields do not match');
    });

    it('uses custom message when provided', () => {
      const customValidator = validators.match<TestForm>('password', 'Passwords must match');
      const formData: TestForm = { password: 'secret123', confirmPassword: 'different' };
      expect(customValidator('different', formData)).toBe('Passwords must match');
    });
  });
});

describe('useFormValidation', () => {
  interface TestFormData {
    name: string;
    email: string;
  }

  const testValidators = {
    name: [validators.required()],
    email: [validators.required(), validators.email()],
  };

  it('initializes with empty errors', () => {
    const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));
    expect(result.current.errors).toEqual({});
  });

  describe('validate', () => {
    it('returns true for valid form data', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate({ name: 'John', email: 'john@example.com' });
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('returns false and sets errors for invalid form data', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate({ name: '', email: 'invalid' });
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors).toEqual({
        name: 'This field is required',
        email: 'Please enter a valid email',
      });
    });

    it('shows only first error per field', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      act(() => {
        result.current.validate({ name: '', email: '' }); // email is empty, hits required first
      });

      expect(result.current.errors.email).toBe('This field is required');
    });
  });

  describe('validateField', () => {
    it('validates single field and returns true if valid', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateField('name', { name: 'John', email: '' });
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors.name).toBeUndefined();
    });

    it('validates single field and returns false if invalid', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateField('name', { name: '', email: '' });
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.name).toBe('This field is required');
    });

    it('returns true for field without validators', () => {
      const { result } = renderHook(() =>
        useFormValidation<TestFormData & { unvalidated: string }>(testValidators)
      );

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateField('unvalidated', {
          name: '',
          email: '',
          unvalidated: '',
        });
      });

      expect(isValid!).toBe(true);
    });

    it('clears previous error when field becomes valid', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      act(() => {
        result.current.validateField('name', { name: '', email: '' });
      });
      expect(result.current.errors.name).toBe('This field is required');

      act(() => {
        result.current.validateField('name', { name: 'John', email: '' });
      });
      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('clearError', () => {
    it('clears error for specified field', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      act(() => {
        result.current.validate({ name: '', email: '' });
      });
      expect(result.current.errors.name).toBeDefined();

      act(() => {
        result.current.clearError('name');
      });
      expect(result.current.errors.name).toBeUndefined();
      expect(result.current.errors.email).toBeDefined(); // Other errors preserved
    });

    it('does nothing if field has no error', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      const originalErrors = result.current.errors;
      act(() => {
        result.current.clearError('name');
      });
      expect(result.current.errors).toEqual(originalErrors);
    });
  });

  describe('setFieldError', () => {
    it('sets error for specified field', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      act(() => {
        result.current.setFieldError('email', 'Email already exists');
      });

      expect(result.current.errors.email).toBe('Email already exists');
    });
  });

  describe('clearAllErrors', () => {
    it('clears all errors', () => {
      const { result } = renderHook(() => useFormValidation<TestFormData>(testValidators));

      act(() => {
        result.current.validate({ name: '', email: '' });
      });
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

      act(() => {
        result.current.clearAllErrors();
      });
      expect(result.current.errors).toEqual({});
    });
  });
});
