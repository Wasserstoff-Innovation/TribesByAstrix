import React, { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

/**
 * PageContainer component provides consistent layout with proper spacing
 * for all pages in the application.
 * 
 * Note: The top padding is already handled by the main layout, so we don't add it here.
 */
export function PageContainer({ 
  children, 
  title, 
  className = ''
}: PageContainerProps) {
  return (
    <div className={`page-container ${className}`}>
      {title && (
        <h1 className="page-title">{title}</h1>
      )}
      {children}
    </div>
  );
}

export default PageContainer; 