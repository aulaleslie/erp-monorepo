import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges single class string', () => {
    expect(cn('text-red-500')).toBe('text-red-500');
  });

  it('merges multiple class strings', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('handles conditional classes (clsx-style)', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base-class', { 'active-class': isActive, 'disabled-class': isDisabled })).toBe(
      'base-class active-class'
    );
  });

  it('handles undefined and null values', () => {
    expect(cn('text-red-500', undefined, null, 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('handles empty strings', () => {
    expect(cn('text-red-500', '', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('merges conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('px-4', 'px-8')).toBe('px-8');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('preserves non-conflicting classes during merge', () => {
    expect(cn('p-4 m-2', 'p-2')).toBe('m-2 p-2');
  });

  it('handles arrays of classes', () => {
    expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500');
  });

  it('handles complex nested conditions', () => {
    const variant = 'primary' as string;
    expect(
      cn('base', {
        'variant-primary': variant === 'primary',
        'variant-secondary': variant === 'secondary',
      })
    ).toBe('base variant-primary');
  });
});
