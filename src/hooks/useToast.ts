import { useState, useCallback } from 'react';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastState extends ToastOptions {
  isOpen: boolean;
}

export function useToast() {
  const [state, setState] = useState<ToastState>({
    isOpen: false,
    message: '',
    type: 'info',
    duration: 3000
  });

  const showToast = useCallback((options: ToastOptions) => {
    setState({
      isOpen: true,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 3000
    });
  }, []);

  const hideToast = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Удобные методы
  const success = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'success', duration });
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'error', duration });
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'info', duration });
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration });
  }, [showToast]);

  return {
    toast: showToast,
    success,
    error,
    info,
    warning,
    toastState: state,
    hideToast
  };
}
