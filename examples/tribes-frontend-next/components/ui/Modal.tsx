import React, { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  variant?: 'default' | 'destructive' | 'info';
  showClose?: boolean;
  preventBackdropClose?: boolean;
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = 'md',
  variant = 'default',
  showClose = true,
  preventBackdropClose = false,
  footer
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle ESC key press and body scrolling
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !preventBackdropClose) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, preventBackdropClose]);
  
  // Add global styles for animations - only runs on client side
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes scaleIn {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      
      .animation-fade-in {
        animation: fadeIn 0.2s ease-out;
      }
      
      .animation-scale-in {
        animation: scaleIn 0.2s ease-out;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node) && !preventBackdropClose) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  // Modal max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };
  
  // Variant styling
  const variantClasses = {
    default: 'bg-card-dark text-foreground-dark',
    destructive: 'bg-red-950 border-red-800 text-red-50',
    info: 'bg-blue-950 border-blue-800 text-blue-50'
  };
  
  // Header variant styling
  const headerVariantClasses = {
    default: 'border-b border-gray-700',
    destructive: 'border-b border-red-800',
    info: 'border-b border-blue-800'
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animation-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className={`${maxWidthClasses[maxWidth]} w-full rounded-lg shadow-xl border border-gray-700 animation-scale-in overflow-hidden ${variantClasses[variant]}`}
      >
        {/* Modal Header */}
        {(title || showClose) && (
          <div className={`flex justify-between items-center p-4 ${headerVariantClasses[variant]}`}>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {showClose && (
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
                aria-label="Close modal"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Modal Content */}
        <div className="p-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {children}
        </div>
        
        {/* Modal Footer */}
        {footer && (
          <div className={`p-4 flex justify-end border-t ${headerVariantClasses[variant]}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
} 