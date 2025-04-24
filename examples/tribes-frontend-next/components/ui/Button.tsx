import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from './Spinner'; // Assuming Spinner is in the same directory

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    disabled,
    ...props 
  }, ref) => {
    
    // Base styles
    const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    // Updated Variant styles with Dark Mode and Accent
    const variantStyles = {
      primary: 'bg-accent text-black hover:bg-accent-hover dark:bg-accent dark:text-black dark:hover:bg-accent-hover focus-visible:ring-accent ring-2 ring-blue-500 ring-offset-background-dark',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-card-dark dark:text-foreground-dark dark:hover:bg-input-dark focus-visible:ring-gray-500',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 dark:border-gray-700 dark:text-foreground-dark dark:hover:bg-input-dark focus-visible:ring-gray-500',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-input-dark dark:text-foreground-dark focus-visible:ring-gray-500',
      link: 'bg-transparent underline-offset-4 hover:underline text-accent focus-visible:ring-accent',
      destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 focus-visible:ring-red-500',
      success: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus-visible:ring-green-500',
    };
    
    // Size styles
    const sizeStyles = {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 py-3 text-lg',
      icon: 'h-10 w-10 p-2.5'
    };
    
    const widthStyles = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Spinner 
            size={size === 'xs' || size === 'sm' ? 'xs' : 'sm'} 
            className="mr-2" 
            color={variant === 'primary' || variant === 'destructive' || variant === 'success' ? 'white' : 'primary'} 
          />
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button }; 