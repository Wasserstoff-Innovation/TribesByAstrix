import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface SidebarItemProps {
  title: string;
  href?: string;
  icon?: ReactNode;
  items?: SidebarItemProps[];
  badge?: ReactNode;
  isCollapsible?: boolean;
}

interface SidebarProps {
  items: SidebarItemProps[];
  className?: string;
  collapsible?: boolean;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
}

export function Sidebar({
  items,
  className = '',
  collapsible = false,
  headerContent,
  footerContent
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  const toggleCollapse = () => {
    if (collapsible) {
      setCollapsed(!collapsed);
    }
  };
  
  return (
    <div 
      className={`flex flex-col h-full bg-card-dark border-r border-gray-700 transition-all duration-300 overflow-hidden ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Header/Logo area */}
      <div className="flex items-center justify-between py-4 px-4 border-b border-gray-700">
        {!collapsed && headerContent}
        {collapsible && (
          <button 
            onClick={toggleCollapse}
            className="p-2 rounded-md text-muted-foreground hover:bg-input-dark hover:text-foreground-dark transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {items.map((item, index) => (
            <SidebarItem 
              key={index} 
              item={item} 
              collapsed={collapsed} 
            />
          ))}
        </nav>
      </div>
      
      {/* Footer */}
      {footerContent && !collapsed && (
        <div className="mt-auto p-4 border-t border-gray-700">
          {footerContent}
        </div>
      )}
    </div>
  );
}

export function SidebarItem({ 
  item, 
  collapsed,
  level = 0 
}: { 
  item: SidebarItemProps; 
  collapsed: boolean;
  level?: number;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  
  // Check if current path matches this item
  const isActive = item.href && (
    pathname === item.href || 
    (pathname?.startsWith(item.href) && item.href !== '/')
  );
  
  // Check if any child is active
  const hasActiveChild = item.items?.some(subItem => 
    subItem.href && (
      pathname === subItem.href || 
      (pathname?.startsWith(subItem.href) && subItem.href !== '/')
    )
  );
  
  const toggleExpand = (e: React.MouseEvent) => {
    if (item.items && item.items.length > 0) {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };
  
  // Styles based on state
  const activeClasses = isActive || hasActiveChild 
    ? 'bg-input-dark text-foreground-dark' 
    : 'text-muted-foreground hover:bg-input-dark hover:text-foreground-dark';
  
  // Indent for nested items
  const indentClasses = level > 0 ? `pl-${level * 3 + 3}` : 'pl-3';
  
  // If item has children
  const hasChildren = item.items && item.items.length > 0;
  
  return (
    <>
      <div className="relative">
        {/* Main item */}
        <Link
          href={item.href || '#'}
          className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors ${indentClasses} ${activeClasses}`}
          onClick={hasChildren ? toggleExpand : undefined}
        >
          <div className="flex items-center overflow-hidden">
            {item.icon && (
              <div className="flex-shrink-0 mr-3">
                {item.icon}
              </div>
            )}
            {!collapsed && (
              <span className="truncate">{item.title}</span>
            )}
          </div>
          
          {!collapsed && (
            <>
              {item.badge && (
                <div className="ml-auto mr-2">
                  {item.badge}
                </div>
              )}
              
              {hasChildren && (
                <div className="ml-1 flex-shrink-0">
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              )}
            </>
          )}
        </Link>
        
        {/* Active item indicator */}
        {isActive && (
          <div className="absolute inset-y-0 left-0 w-1 bg-accent rounded-full" />
        )}
      </div>
      
      {/* Child items */}
      {!collapsed && hasChildren && expanded && (
        <div className="mt-1 mb-1">
          {item.items?.map((subItem, idx) => (
            <SidebarItem 
              key={idx} 
              item={subItem} 
              collapsed={collapsed} 
              level={level + 1}
            />
          ))}
        </div>
      )}
    </>
  );
} 