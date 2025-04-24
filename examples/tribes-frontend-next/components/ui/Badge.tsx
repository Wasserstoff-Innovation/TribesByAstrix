import React, { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  pill?: boolean;
  dot?: boolean;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className = '', 
    variant = 'default', 
    size = 'md',
    icon,
    pill = false,
    dot = false,
    children, 
    ...props 
  }, ref) => {
    
    // Base styles
    const baseStyles = 'inline-flex items-center font-medium';
    
    // Variant styles
    const variantStyles = {
      default: 'bg-blue-100 text-blue-800',
      secondary: 'bg-gray-100 text-gray-800',
      outline: 'bg-transparent text-gray-700 border border-gray-300',
      destructive: 'bg-red-100 text-red-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
    };
    
    // Size styles
    const sizeStyles = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-xs px-2.5 py-0.5',
      lg: 'text-sm px-3 py-1',
    };
    
    // Border radius styles
    const radiusStyles = pill ? 'rounded-full' : 'rounded-md';
    
    // Dot styles
    const dotColor = {
      default: 'bg-blue-500',
      secondary: 'bg-gray-500',
      outline: 'bg-gray-500',
      destructive: 'bg-red-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${radiusStyles} ${className}`}
        {...props}
      >
        {dot && (
          <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${dotColor[variant]}`} />
        )}
        {icon && (
          <span className="mr-1.5">{icon}</span>
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge }; 