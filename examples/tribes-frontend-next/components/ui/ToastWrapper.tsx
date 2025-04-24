'use client';

import React, { ReactNode } from 'react';
import { ToastProvider } from './Toast';

interface ToastWrapperProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * ToastWrapper is a component that wraps its children in a ToastProvider.
 * Use this component when you need to provide toast functionality to a component
 * that is not already wrapped in a ToastProvider.
 * 
 * This is useful for standalone components that might be used in multiple places.
 * For application-wide toast notifications, use the ToastProvider in the layout.
 */
export function ToastWrapper({ 
  children, 
  position = 'bottom-right' 
}: ToastWrapperProps) {
  return (
    <ToastProvider position={position}>
      {children}
    </ToastProvider>
  );
}

export default ToastWrapper; 