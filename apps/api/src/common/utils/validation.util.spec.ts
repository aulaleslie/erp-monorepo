import { ValidationErrorBuilder, createValidationBuilder } from './validation.util';
import { BadRequestException } from '@nestjs/common';

describe('ValidationErrorBuilder', () => {
  let builder: ValidationErrorBuilder;

  beforeEach(() => {
    builder = createValidationBuilder();
  });

  describe('addError', () => {
    it('should add single error to a field', () => {
      builder.addError('email', 'Email is invalid');
      expect(builder.getErrors()).toEqual({
        email: ['Email is invalid'],
      });
    });

    it('should add multiple errors to the same field', () => {
      builder.addError('password', 'Password is too short');
      builder.addError('password', 'Password must contain a number');
      expect(builder.getErrors()).toEqual({
        password: ['Password is too short', 'Password must contain a number'],
      });
    });

    it('should add errors to multiple fields', () => {
      builder.addError('email', 'Email is invalid');
      builder.addError('password', 'Password is too short');
      expect(builder.getErrors()).toEqual({
        email: ['Email is invalid'],
        password: ['Password is too short'],
      });
    });

    it('should support method chaining', () => {
      const result = builder.addError('field1', 'error1').addError('field2', 'error2');
      expect(result).toBe(builder);
      expect(builder.hasErrors()).toBe(true);
    });
  });

  describe('hasErrors', () => {
    it('should return false when no errors', () => {
      expect(builder.hasErrors()).toBe(false);
    });

    it('should return true when errors exist', () => {
      builder.addError('field', 'error');
      expect(builder.hasErrors()).toBe(true);
    });
  });

  describe('getErrors', () => {
    it('should return empty object when no errors', () => {
      expect(builder.getErrors()).toEqual({});
    });
  });

  describe('throwIfErrors', () => {
    it('should not throw when no errors', () => {
      expect(() => builder.throwIfErrors()).not.toThrow();
    });

    it('should throw BadRequestException when errors exist', () => {
      builder.addError('name', 'Name is required');
      expect(() => builder.throwIfErrors()).toThrow(BadRequestException);
    });

    it('should include validation message and errors in exception', () => {
      builder.addError('email', 'Email is taken');
      try {
        builder.throwIfErrors();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse() as any;
        expect(response.message).toBe('Validation failed');
        expect(response.errors).toEqual({
          email: ['Email is taken'],
        });
      }
    });
  });

  describe('clear', () => {
    it('should clear all errors', () => {
      builder.addError('field', 'error');
      expect(builder.hasErrors()).toBe(true);
      
      builder.clear();
      expect(builder.hasErrors()).toBe(false);
      expect(builder.getErrors()).toEqual({});
    });

    it('should support method chaining', () => {
      const result = builder.clear();
      expect(result).toBe(builder);
    });
  });
});

describe('createValidationBuilder', () => {
  it('should return new ValidationErrorBuilder instance', () => {
    const builder = createValidationBuilder();
    expect(builder).toBeInstanceOf(ValidationErrorBuilder);
  });

  it('should return independent instances', () => {
    const builder1 = createValidationBuilder();
    const builder2 = createValidationBuilder();
    
    builder1.addError('field', 'error');
    expect(builder1.hasErrors()).toBe(true);
    expect(builder2.hasErrors()).toBe(false);
  });
});
