import React, { HTMLAttributes, forwardRef } from 'react';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'border' | 'dots';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'white';
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className = '', size = 'md', variant = 'border', color = 'primary', ...props }, ref) => {
    // Size classes
    const sizeClasses = {
      xs: 'h-4 w-4',
      sm: 'h-5 w-5',
      md: 'h-8 w-8',
      lg: 'h-10 w-10',
      xl: 'h-12 w-12',
    };
    
    // Color classes
    const colorClasses = {
      primary: 'border-blue-600 text-blue-600',
      secondary: 'border-gray-600 text-gray-600',
      success: 'border-green-600 text-green-600',
      warning: 'border-yellow-600 text-yellow-600',
      error: 'border-red-600 text-red-600',
      white: 'border-white text-white',
    };
    
    // Border spinner
    if (variant === 'border') {
      return (
        <div 
          ref={ref} 
          className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
          {...props}
        />
      );
    }
    
    // Dots spinner
    return (
      <div 
        ref={ref} 
        className={`inline-flex items-center ${className}`}
        {...props}
      >
        <div className={`mr-1 animate-bounce delay-75 rounded-full bg-current ${sizeClasses.xs}`} />
        <div className={`mr-1 animate-bounce delay-100 rounded-full bg-current ${sizeClasses.xs}`} />
        <div className={`animate-bounce delay-150 rounded-full bg-current ${sizeClasses.xs}`} />
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner }; 