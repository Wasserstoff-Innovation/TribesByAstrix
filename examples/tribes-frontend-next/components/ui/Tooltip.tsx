import React, { HTMLAttributes, useState, useRef, useEffect } from 'react';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  arrow?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  arrow = true,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const childRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  let timeoutId: NodeJS.Timeout;

  const showTooltip = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setIsVisible(true);
      calculatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const calculatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;

    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = childRect.left + scrollX + (childRect.width / 2) - (tooltipRect.width / 2);
        y = childRect.top + scrollY - tooltipRect.height - 8;
        break;
      case 'right':
        x = childRect.right + scrollX + 8;
        y = childRect.top + scrollY + (childRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'bottom':
        x = childRect.left + scrollX + (childRect.width / 2) - (tooltipRect.width / 2);
        y = childRect.bottom + scrollY + 8;
        break;
      case 'left':
        x = childRect.left + scrollX - tooltipRect.width - 8;
        y = childRect.top + scrollY + (childRect.height / 2) - (tooltipRect.height / 2);
        break;
    }

    // Make sure tooltip doesn't go offscreen
    const padding = 10;
    x = Math.max(padding, Math.min(x, window.innerWidth + scrollX - tooltipRect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight + scrollY - tooltipRect.height - padding));

    setCoords({ x, y });
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const arrowPositionClass = {
    top: 'after:left-1/2 after:-translate-x-1/2 after:bottom-[calc(100%-5px)] after:border-t-transparent after:border-r-transparent after:border-b-black after:border-l-transparent',
    right: 'after:top-1/2 after:-translate-y-1/2 after:left-[calc(100%-5px)] after:border-t-transparent after:border-r-transparent after:border-b-transparent after:border-l-black',
    bottom: 'after:left-1/2 after:-translate-x-1/2 after:top-[calc(100%-5px)] after:border-t-black after:border-r-transparent after:border-b-transparent after:border-l-transparent',
    left: 'after:top-1/2 after:-translate-y-1/2 after:right-[calc(100%-5px)] after:border-t-transparent after:border-r-black after:border-b-transparent after:border-l-transparent',
  };

  const arrowClass = arrow
    ? `after:absolute after:content-[''] after:border-4 ${arrowPositionClass[position]}`
    : '';

  return (
    <>
      <div
        ref={childRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-2 py-1 text-xs font-medium text-white bg-black rounded shadow-lg ${arrowClass} ${className}`}
          style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
          {...props}
        >
          {content}
        </div>
      )}
    </>
  );
};

export default Tooltip; 