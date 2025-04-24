'use client';

import React, { useState } from 'react';
import { Button, Card, useToasts, ToastType } from '../../components/ui';

/**
 * A simple example component that demonstrates how to use the toast system.
 * This component displays buttons for showing different types of toast notifications.
 */
export default function ToastExample() {
  const { showToast } = useToasts();
  const [customDuration, setCustomDuration] = useState(3000);
  
  // Helper function to show a toast with specific type
  const showToastByType = (type: ToastType) => {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    };
    
    const messages = {
      success: 'Operation completed successfully!',
      error: 'An error occurred during the operation.',
      warning: 'Proceed with caution.',
      info: 'Here is some useful information.'
    };
    
    showToast({
      type,
      title: titles[type],
      message: messages[type],
      duration: customDuration
    });
  };
  
  // Showcase a complex toast with custom content
  const showCustomActionToast = () => {
    showToast({
      type: 'info',
      title: 'Custom Action Toast',
      message: 'This toast has a custom action button.',
      duration: 0, // 0 means it won't automatically dismiss
      action: (
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => alert('Custom action clicked!')}
          className="mt-2"
        >
          Take Action
        </Button>
      )
    });
  };
  
  // Show a toast with no duration (must be manually dismissed)
  const showPersistentToast = () => {
    showToast({
      type: 'warning',
      title: 'Persistent Toast',
      message: 'This toast will remain until you dismiss it.',
      duration: 0 // 0 means it won't automatically dismiss
    });
  };
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Toast Notification Examples</h2>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button variant="primary" onClick={() => showToastByType('success')}>
            Success Toast
          </Button>
          <Button variant="primary" onClick={() => showToastByType('error')}>
            Error Toast
          </Button>
          <Button variant="primary" onClick={() => showToastByType('warning')}>
            Warning Toast
          </Button>
          <Button variant="primary" onClick={() => showToastByType('info')}>
            Info Toast
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Advanced Examples</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={showCustomActionToast}>
                Toast with Action Button
              </Button>
              <Button variant="secondary" onClick={showPersistentToast}>
                Persistent Toast
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Custom Duration</h3>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="500" 
                max="10000" 
                step="500" 
                value={customDuration} 
                onChange={(e) => setCustomDuration(parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium whitespace-nowrap">
                {customDuration === 0 ? 'Persistent' : `${customDuration / 1000}s`}
              </span>
            </div>
            <Button 
              variant="primary" 
              onClick={() => showToast({
                type: 'info',
                title: 'Custom Duration',
                message: `This toast will disappear in ${customDuration / 1000} seconds.`,
                duration: customDuration
              })}
              className="mt-3 w-full"
            >
              Show Custom Duration Toast
            </Button>
          </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Usage Instructions</h2>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-auto text-sm">
{`// Import the hook
import { useToasts } from '../components/ui';

// Inside your component
function MyComponent() {
  const { showToast } = useToasts();
  
  // Show a simple success toast
  const handleSuccess = () => {
    showToast({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully',
      duration: 3000 // 3 seconds
    });
  };
  
  // Show a toast with a custom action
  const handleCustomAction = () => {
    showToast({
      type: 'info',
      title: 'Custom Action',
      message: 'This toast has a button',
      duration: 0, // Persistent
      action: <button onClick={someAction}>Click me</button>
    });
  };
}`}
        </pre>
      </Card>
    </div>
  );
} 