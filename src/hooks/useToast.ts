import { useState, useCallback } from 'react';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onUndo?: () => void; // NEW: Undo callback
  undoLabel?: string; // NEW: Undo button label
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  onUndo?: () => void;
  undoLabel?: string;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
    onUndo: undefined,
    undoLabel: 'Undo',
  });

  const showToast = useCallback(({
    message,
    type = 'success',
    duration = 3000,
    onUndo,
    undoLabel = 'Undo',
  }: ToastOptions) => {
    setToast({
      visible: true,
      message,
      type,
      onUndo,
      undoLabel,
    });

    // Auto-hide after duration
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    ...toast,
    showToast,
    hideToast,
  };
};
