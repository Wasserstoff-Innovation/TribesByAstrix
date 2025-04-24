import React, { useState, useRef, useEffect, ReactNode } from 'react';

export interface DropdownItemProps {
  label: string | ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  isActive?: boolean;
  isDanger?: boolean;
  isDisabled?: boolean;
  children?: ReactNode;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItemProps[];
  align?: 'left' | 'right';
  width?: number | string;
  className?: string;
  position?: 'bottom' | 'top' | 'right' | 'left';
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function Dropdown({
  trigger,
  items,
  align = 'left',
  width = 200,
  className = '',
  position = 'bottom',
  isOpen: controlledIsOpen,
  onOpenChange
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle controlled/uncontrolled state
  const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;
  
  const handleOpen = (newOpen: boolean) => {
    if (controlledIsOpen === undefined) {
      setIsOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };
  
  const toggleDropdown = () => {
    handleOpen(!open);
  };
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, handleOpen]);
  
  // Close dropdown on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleOpen(false);
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, handleOpen]);
  
  // Position classes
  const positionClasses = {
    bottom: 'top-full mt-1',
    top: 'bottom-full mb-1',
    right: 'left-full ml-1',
    left: 'right-full mr-1'
  };
  
  // Alignment classes
  const alignClasses = {
    left: 'left-0',
    right: 'right-0'
  };
  
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Dropdown trigger */}
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>
      
      {/* Dropdown menu */}
      {open && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} ${alignClasses[align]} bg-card-dark border border-gray-700 rounded-md shadow-lg overflow-hidden animation-scale-in`}
          style={{ width: typeof width === 'number' ? `${width}px` : width }}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            {items.map((item, index) => (
              <DropdownItem key={index} item={item} onSelect={() => handleOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemComponentProps {
  item: DropdownItemProps;
  onSelect: () => void;
}

function DropdownItem({ item, onSelect }: DropdownItemComponentProps) {
  const {
    label,
    onClick,
    href,
    icon,
    isActive,
    isDanger,
    isDisabled,
    children
  } = item;
  
  const baseClasses = 'block w-full text-left px-4 py-2 text-sm transition-colors';
  const activeClasses = isActive ? 'bg-input-dark text-foreground-dark' : '';
  const dangerClasses = isDanger ? 'text-red-400 hover:text-red-300' : 'text-muted-foreground hover:text-foreground-dark';
  const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-input-dark';
  
  const handleClick = () => {
    if (isDisabled) return;
    onClick?.();
    onSelect();
  };
  
  const content = (
    <>
      <div className="flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        <span>{label}</span>
      </div>
      {children}
    </>
  );
  
  if (href && !isDisabled) {
    return (
      <a
        href={href}
        className={`${baseClasses} ${activeClasses} ${dangerClasses} ${disabledClasses}`}
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }
  
  return (
    <button
      type="button"
      className={`${baseClasses} ${activeClasses} ${dangerClasses} ${disabledClasses}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {content}
    </button>
  );
} 