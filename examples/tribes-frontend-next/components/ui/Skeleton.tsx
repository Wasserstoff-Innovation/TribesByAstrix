import React, { useEffect } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  // Base styles
  const baseClasses = 'bg-gray-700/50';
  
  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };
  
  // Variant classes
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  };
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
  @keyframes skeletonWave {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  
  .animate-wave {
    background: linear-gradient(90deg, rgba(75, 85, 99, 0.2) 25%, rgba(75, 85, 99, 0.5) 37%, rgba(75, 85, 99, 0.2) 63%);
    background-size: 200px 100%;
    animation: skeletonWave 1.5s infinite linear;
  }
`;
    document.head.appendChild(style);
//Loading.
//Loading.=> {
//Loading..ad.removeChild(style);
//Loading..
  }, []);
  // Default dimensions based on variant
  const getDefaultDimensions = () => {
    switch (variant) {
      case 'text':
        return { width: width || '100%', height: height || '1rem' };
      case 'circular':
        return { width: width || '2.5rem', height: height || '2.5rem' };
      case 'rectangular':
      case 'rounded':
        return { width: width || '100%', height: height || '100px' };
      default:
        return { width, height };
    }
  };
  
  const dimensions = getDefaultDimensions();
  
  const style = {
    width: dimensions.width,
    height: dimensions.height
  };
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Skeleton presets for common UI elements
export const SkeletonAvatar = ({ size = 40 }: { size?: number }) => (
  <Skeleton variant="circular" width={size} height={size} />
);

interface SkeletonTextProps {
  lines?: number;
  width?: string | number;
}

export const SkeletonText = ({ lines = 1, width = '100%' }: SkeletonTextProps) => (
  <div className="space-y-2">
    {Array.from(new Array(lines)).map((_, i) => (
      <Skeleton 
        key={i} 
        variant="text" 
        width={i === lines - 1 && typeof width === 'string' ? `calc(${width} * 0.6)` : width}
      />
    ))}
  </div>
);

export const SkeletonButton = ({ width = '5rem', height = '2.25rem' }: { width?: string | number; height?: string | number }) => (
  <Skeleton variant="rounded" width={width} height={height} />
);

export const SkeletonCard = () => (
  <div className="space-y-4 rounded-lg border border-gray-700 p-4">
    <div className="flex items-center space-x-3">
      <SkeletonAvatar />
      <div className="space-y-2 flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <div className="space-y-2">
      {Array.from(new Array(3)).map((_, i) => (
        <Skeleton key={i} variant="text" width="100%" />
      ))}
    </div>
    <Skeleton variant="rounded" height={200} />
    <div className="flex justify-between pt-2">
      <SkeletonButton width="25%" />
      <SkeletonButton width="25%" />
      <SkeletonButton width="25%" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 3 }: { rows?: number; columns?: number }) => (
  <div className="space-y-4">
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from(new Array(columns)).map((_, i) => (
        <div key={i} className="flex-1">
          <Skeleton variant="text" height="1.5rem" />
        </div>
      ))}
    </div>
    
    {/* Rows */}
    {Array.from(new Array(rows)).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 py-3">
        {Array.from(new Array(columns)).map((_, colIndex) => (
          <div key={colIndex} className="flex-1">
            <Skeleton variant="text" width={colIndex === 0 ? '60%' : '90%'} />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from(new Array(items)).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 border border-gray-700 rounded-lg">
        <SkeletonAvatar size={32} />
        <div className="flex-1">
          <Skeleton variant="text" width="40%" />
          <div className="mt-2">
            <Skeleton variant="text" width="90%" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
