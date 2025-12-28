import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reducer } from './use-toast';

// Type definitions for testing (matching the module's internal types)
type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  open?: boolean;
};

type State = {
  toasts: ToasterToast[];
};

type Action =
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

describe('use-toast reducer', () => {
  const initialState: State = { toasts: [] };

  describe('ADD_TOAST', () => {
    it('adds a toast to empty state', () => {
      const toast: ToasterToast = { id: '1', title: 'Test Toast' };
      const action: Action = { type: 'ADD_TOAST', toast };

      const result = reducer(initialState, action);

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0]).toEqual(toast);
    });

    it('adds toast to the beginning of the list', () => {
      const existingToast: ToasterToast = { id: '1', title: 'First' };
      const newToast: ToasterToast = { id: '2', title: 'Second' };
      const state: State = { toasts: [existingToast] };

      const result = reducer(state, { type: 'ADD_TOAST', toast: newToast });

      expect(result.toasts[0]).toEqual(newToast);
    });

    it('limits toasts to TOAST_LIMIT (1)', () => {
      const toast1: ToasterToast = { id: '1', title: 'First' };
      const toast2: ToasterToast = { id: '2', title: 'Second' };
      const state: State = { toasts: [toast1] };

      const result = reducer(state, { type: 'ADD_TOAST', toast: toast2 });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });
  });

  describe('UPDATE_TOAST', () => {
    it('updates an existing toast', () => {
      const toast: ToasterToast = { id: '1', title: 'Original' };
      const state: State = { toasts: [toast] };

      const result = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated' },
      });

      expect(result.toasts[0].title).toBe('Updated');
    });

    it('does not affect other toasts', () => {
      const toast1: ToasterToast = { id: '1', title: 'First' };
      const toast2: ToasterToast = { id: '2', title: 'Second' };
      const state: State = { toasts: [toast1, toast2] };

      const result = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated First' },
      });

      expect(result.toasts[1].title).toBe('Second');
    });

    it('preserves existing properties when updating', () => {
      const toast: ToasterToast = { id: '1', title: 'Title', description: 'Desc' };
      const state: State = { toasts: [toast] };

      const result = reducer(state, {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'New Title' },
      });

      expect(result.toasts[0].title).toBe('New Title');
      expect(result.toasts[0].description).toBe('Desc');
    });
  });

  describe('DISMISS_TOAST', () => {
    it('sets open to false for specific toast', () => {
      const toast: ToasterToast = { id: '1', title: 'Test', open: true };
      const state: State = { toasts: [toast] };

      const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });

      expect(result.toasts[0].open).toBe(false);
    });

    it('dismisses all toasts when no toastId provided', () => {
      const toast1: ToasterToast = { id: '1', title: 'First', open: true };
      const toast2: ToasterToast = { id: '2', title: 'Second', open: true };
      const state: State = { toasts: [toast1, toast2] };

      const result = reducer(state, { type: 'DISMISS_TOAST' });

      expect(result.toasts.every((t) => t.open === false)).toBe(true);
    });

    it('only dismisses matching toast', () => {
      const toast1: ToasterToast = { id: '1', title: 'First', open: true };
      const toast2: ToasterToast = { id: '2', title: 'Second', open: true };
      const state: State = { toasts: [toast1, toast2] };

      const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });

      expect(result.toasts[0].open).toBe(false);
      expect(result.toasts[1].open).toBe(true);
    });
  });

  describe('REMOVE_TOAST', () => {
    it('removes specific toast by id', () => {
      const toast1: ToasterToast = { id: '1', title: 'First' };
      const toast2: ToasterToast = { id: '2', title: 'Second' };
      const state: State = { toasts: [toast1, toast2] };

      const result = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });

      expect(result.toasts).toHaveLength(1);
      expect(result.toasts[0].id).toBe('2');
    });

    it('removes all toasts when no toastId provided', () => {
      const toast1: ToasterToast = { id: '1', title: 'First' };
      const toast2: ToasterToast = { id: '2', title: 'Second' };
      const state: State = { toasts: [toast1, toast2] };

      const result = reducer(state, { type: 'REMOVE_TOAST' });

      expect(result.toasts).toHaveLength(0);
    });

    it('does nothing if toast not found', () => {
      const toast: ToasterToast = { id: '1', title: 'Test' };
      const state: State = { toasts: [toast] };

      const result = reducer(state, { type: 'REMOVE_TOAST', toastId: 'nonexistent' });

      expect(result.toasts).toHaveLength(1);
    });
  });
});
