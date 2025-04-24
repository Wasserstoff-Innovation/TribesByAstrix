import React, { HTMLAttributes, ImgHTMLAttributes, forwardRef } from 'react';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

export interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className = '', size = 'md', src, alt, fallback, status, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);
    
    // Size styles
    const sizeStyles = {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl',
    };
    
    // Status styles
    const statusStyles = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    };
    
    const getInitials = (text?: string) => {
      if (!text) return '';
      return text
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };
    
    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="font-medium text-gray-700">
            {getInitials(fallback || alt)}
          </span>
        )}
        
        {status && (
          <span 
            className={`absolute right-0 bottom-0 block rounded-full ring-2 ring-white ${statusStyles[status]}`} 
            style={{ width: size === 'xs' ? '6px' : size === 'sm' ? '8px' : '10px', height: size === 'xs' ? '6px' : size === 'sm' ? '8px' : '10px' }}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar }; 