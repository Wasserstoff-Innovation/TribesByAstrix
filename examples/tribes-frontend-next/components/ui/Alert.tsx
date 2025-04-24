import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  title?: string;
  children: ReactNode;
  variant?: AlertVariant;
  icon?: ReactNode;
  onClose?: () => void;
  actions?: ReactNode;
  className?: string;
}

const icons = {
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const variantClasses = {
  info: 'bg-blue-900/30 border-blue-800 text-blue-100',
  success: 'bg-green-900/30 border-green-800 text-green-100',
  warning: 'bg-yellow-900/30 border-yellow-800 text-yellow-100',
  error: 'bg-red-900/30 border-red-800 text-red-100',
};

export function Alert({
  title,
  children,
  variant = 'info',
  icon,
  onClose,
  actions,
  className = '',
}: AlertProps) {
  return (
    <div className={`rounded-md border p-4 ${variantClasses[variant]} ${className}`} role="alert">
      <div className="flex">
        {/* Icon */}
        {(icon || icons[variant]) && (
          <div className="flex-shrink-0 mr-3">
            {icon || icons[variant]}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
          
          {/* Actions if provided */}
          {actions && (
            <div className="mt-3">{actions}</div>
          )}
        </div>
        
        {/* Close button */}
        {onClose && (
          <div className="ml-3 flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white opacity-80 hover:opacity-100"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Variants with predefined settings
export function InfoAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="info" {...props} />;
}

export function SuccessAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="success" {...props} />;
}

export function WarningAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="warning" {...props} />;
}

export function ErrorAlert(props: Omit<AlertProps, 'variant'>) {
  return <Alert variant="error" {...props} />;
} 