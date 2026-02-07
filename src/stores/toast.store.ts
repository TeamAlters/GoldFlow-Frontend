import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastState = {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
};

let toastId = 0;
export const TOAST_DURATION_MS = 4000;
export const MAX_TOASTS = 3;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = `toast-${++toastId}-${Date.now()}`;
    set((state) => {
      const next = [...state.toasts, { id, message, type }];
      const trimmed = next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next;
      return { toasts: trimmed };
    });
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (message: string) => useToastStore.getState().addToast(message, 'success'),
  error: (message: string) => useToastStore.getState().addToast(message, 'error'),
  warning: (message: string) => useToastStore.getState().addToast(message, 'warning'),
  info: (message: string) => useToastStore.getState().addToast(message, 'info'),
};
