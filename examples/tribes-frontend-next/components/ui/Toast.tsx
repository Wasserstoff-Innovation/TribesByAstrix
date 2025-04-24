'use client';

import React, { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  icon?: ReactNode;
  action?: ReactNode;
}

// Icons for each toast type
const ToastIcons = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
    </svg>
  )
};

// Color variants for each toast type
const toastVariants = {
  success: 'bg-gray-900/90 border-l-4 border-neon-green text-neon-green-100',
  error: 'bg-gray-900/90 border-l-4 border-neon-red text-neon-red-100',
  warning: 'bg-gray-900/90 border-l-4 border-neon-yellow text-neon-yellow-100',
  info: 'bg-gray-900/90 border-l-4 border-neon-blue text-neon-blue-100'
};

export function Toast({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  icon,
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration <= 0) return; // Don't auto-close if duration is 0 or negative

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - (100 / (duration / 100));
      });
    }, 100);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose(id);
      }, 300); // Wait for fade-out animation to complete
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  // Define neon shadow effects based on toast type
  const neonGlowClasses = {
    success: 'shadow-[0_0_10px_rgba(80,250,123,0.2)]',
    error: 'shadow-[0_0_10px_rgba(255,85,85,0.2)]',
    warning: 'shadow-[0_0_10px_rgba(255,184,108,0.2)]',
    info: 'shadow-[0_0_10px_rgba(80,120,255,0.2)]'
  };

  // Custom progress bar colors
  const progressBarColors = {
    success: 'bg-neon-green',
    error: 'bg-neon-red',
    warning: 'bg-neon-yellow',
    info: 'bg-neon-blue'
  };

  return (
    <div 
      className={`max-w-xs w-full ${neonGlowClasses[type]} rounded-lg overflow-hidden backdrop-blur-sm ${toastVariants[type]} ${isVisible ? 'animate-slide-in' : 'animate-fade-out opacity-0'} transform transition-all duration-300`}
      role="alert"
    >
      <div className="py-2.5 px-3">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5">
            {icon || ToastIcons[type]}
          </div>
          <div className="ml-2.5 flex-1">
            {title && <p className="text-sm font-medium mb-0.5">{title}</p>}
            <p className="text-xs opacity-90">{message}</p>
            {action && (
              <div className="mt-1.5">
                {action}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="ml-2 flex-shrink-0 rounded-full p-1 text-current opacity-70 hover:opacity-100 focus:outline-none"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-0.5 bg-gray-700">
          <div 
            className={`h-full ${progressBarColors[type]}`}
            style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
          />
        </div>
      )}
    </div>
  );
}

// ToastContainer to hold all toast notifications
interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  children: ReactNode;
}

export function ToastContainer({ position = 'top-right', children }: ToastContainerProps) {
  // Position classes
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2'
  };

  // Create portal for the toast container
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Check if the toast container exists; if not, create it
    let element = document.getElementById('toast-container');
    if (!element) {
      element = document.createElement('div');
      element.id = 'toast-container';
      document.body.appendChild(element);
    }
    setPortalElement(element);

    return () => {
      // Don't remove the container on unmount as other components might use it
    };
  }, []);

  if (!portalElement) return null;

  return createPortal(
    <div className={`fixed ${positionClasses[position]} z-50 p-3 space-y-2.5 pointer-events-none max-w-xs`}>
      {children}
    </div>,
    portalElement
  );
}

// ToastManager for managing multiple toasts
interface ToastManagerState {
  toasts: ToastProps[];
}

class ToastManager {
  private static instance: ToastManager;
  private state: ToastManagerState = { toasts: [] };
  private listeners: ((state: ToastManagerState) => void)[] = [];

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public subscribe(listener: (state: ToastManagerState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  public show(toast: Omit<ToastProps, 'id' | 'onClose'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: (toastId) => this.dismiss(toastId)
    };
    
    this.state = {
      toasts: [...this.state.toasts, newToast]
    };
    
    this.notify();
    return id;
  }

  public dismiss(id: string) {
    this.state = {
      toasts: this.state.toasts.filter(t => t.id !== id)
    };
    this.notify();
  }

  public clear() {
    this.state = { toasts: [] };
    this.notify();
  }
}

// Toast context type
interface ToastContextType {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider component
export function ToastProvider({ 
  children, 
  position = 'bottom-right' 
}: { 
  children: ReactNode;
  position?: ToastContainerProps['position'];
}) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const toastManager = ToastManager.getInstance();

  useEffect(() => {
    return toastManager.subscribe(state => {
      setToasts(state.toasts);
    });
  }, []);

  const value = {
    toasts,
    showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => toastManager.show(toast),
    dismissToast: (id: string) => toastManager.dismiss(id),
    clearToasts: () => toastManager.clear()
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer position={position}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

// Toast hook
export function useToasts() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  
  return context;
}

// Toast component styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(120%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(120%);
      opacity: 0;
    }
  }
  
  .animate-slide-in {
    animation: slideIn 0.3s ease-out forwards;
  }
  
  .animate-fade-out {
    animation: fadeOut 0.3s ease-in forwards;
  }
  
  #toast-container {
    pointer-events: none;
  }
  
  #toast-container > div > div {
    pointer-events: auto;
  }
`;
document.head.appendChild(style); 