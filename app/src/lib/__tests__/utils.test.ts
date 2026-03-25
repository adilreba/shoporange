import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'conditional')).toBe('base conditional');
    expect(cn('base', false && 'conditional')).toBe('base');
  });

  it('should handle tailwind merge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('should filter out falsy values', () => {
    expect(cn('base', null, undefined, false, 'valid')).toBe('base valid');
  });
});
