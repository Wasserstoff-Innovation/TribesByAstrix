import React, { HTMLAttributes, forwardRef, useState } from 'react';

export interface TabItem {
  id: string;
  label: string | React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabItem[];
  defaultTab?: string;
  variant?: 'underline' | 'pills' | 'boxed';
  align?: 'start' | 'center' | 'end';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onChange?: (id: string) => void;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ 
    className = '',
    items = [],
    defaultTab,
    variant = 'underline',
    align = 'start',
    size = 'md',
    fullWidth = false,
    onChange,
    ...props 
  }, ref) => {
    const [activeTab, setActiveTab] = useState<string>(defaultTab || (items.length > 0 ? items[0].id : ''));
    
    const handleTabClick = (id: string) => {
      setActiveTab(id);
      if (onChange) {
        onChange(id);
      }
    };
    
    // Variant styles
    const variantStyles = {
      underline: {
        container: 'border-b border-gray-200',
        tab: 'border-b-2 border-transparent hover:border-gray-300',
        active: 'border-blue-500 text-blue-600',
      },
      pills: {
        container: '',
        tab: 'rounded-md hover:bg-gray-100',
        active: 'bg-blue-100 text-blue-700',
      },
      boxed: {
        container: 'border-b border-gray-200',
        tab: 'border-b border-transparent rounded-t-lg hover:bg-gray-50',
        active: 'bg-white border-gray-200 border-b-white border-t border-l border-r text-blue-600',
      },
    };
    
    // Size styles
    const sizeStyles = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };
    
    // Alignment styles
    const alignStyles = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    };
    
    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        <div 
          className={`flex ${alignStyles[align]} ${variantStyles[variant].container}`}
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && handleTabClick(item.id)}
              disabled={item.disabled}
              className={`
                ${sizeStyles[size]}
                ${variantStyles[variant].tab}
                ${activeTab === item.id ? variantStyles[variant].active : ''}
                px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                ${item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${fullWidth ? 'flex-1 text-center' : ''}
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {items.find(item => item.id === activeTab)?.content}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

export { Tabs }; 