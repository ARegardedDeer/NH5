import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GlobalToast } from '../components/shared/GlobalToast';

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('success');
  const [duration, setDuration] = useState(5000);
  const [onUndo, setOnUndo] = useState<(() => void) | undefined>(undefined);
  const [undoLabel, setUndoLabel] = useState('Undo');

  const showToast = useCallback(({
    message,
    type = 'success',
    duration = 5000,
    onUndo,
    undoLabel = 'Undo',
  }: ToastOptions) => {
    console.log('[ToastContext] 🎯 showToast called:', message, 'type:', type);
    setMessage(message);
    setType(type);
    setDuration(duration);
    setOnUndo(() => onUndo); // Wrap in arrow function to store function reference
    setUndoLabel(undoLabel);
    setVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    console.log('[ToastContext] 🔽 hideToast called');
    setVisible(false);
    // Clean up after animation
    setTimeout(() => {
      setOnUndo(undefined);
    }, 300);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {/* Toast renders here at root level */}
      <GlobalToast
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onDismiss={hideToast}
        onUndo={onUndo}
        undoLabel={undoLabel}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
