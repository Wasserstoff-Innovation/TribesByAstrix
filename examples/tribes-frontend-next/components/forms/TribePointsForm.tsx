import React, { useState, useEffect } from 'react';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { Card, Button, Input } from '../ui';

// Available action types - would typically come from SDK constants
const ACTION_TYPES = [
  { id: 'POST_CREATE', name: 'Create Post', description: 'Points for creating a post' },
  { id: 'POST_LIKE', name: 'Like Post', description: 'Points for liking a post' },
  { id: 'POST_COMMENT', name: 'Comment on Post', description: 'Points for commenting on a post' },
  { id: 'POST_SHARE', name: 'Share Post', description: 'Points for sharing a post' },
  { id: 'JOIN_TRIBE', name: 'Join Tribe', description: 'Points for joining the tribe' },
  { id: 'DAILY_LOGIN', name: 'Daily Login', description: 'Points for logging in daily' },
  { id: 'INVITE_MEMBER', name: 'Invite Member', description: 'Points for inviting a new member' }
];

interface TribePointsFormProps {
  sdk: AstrixSDK | null;
  tribeId: number;
  onUpdate: () => void;
}

interface PointsConfig {
  actionType: string;
  points: number;
}

interface FormErrors {
  [key: string]: string;
}

const TribePointsForm: React.FC<TribePointsFormProps> = ({ sdk, tribeId, onUpdate }) => {
  const [pointsConfig, setPointsConfig] = useState<PointsConfig[]>([]);
  const [currentAction, setCurrentAction] = useState<string>(ACTION_TYPES[0].id);
  const [currentPoints, setCurrentPoints] = useState<string>('10');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fetch existing points configuration when component mounts
  useEffect(() => {
    if (sdk && tribeId) {
      fetchPointsConfig();
    }
  }, [sdk, tribeId]);
  
  const fetchPointsConfig = async () => {
    if (!sdk) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // This would need to be updated with the actual SDK method to get action points config
      // For now, we'll simulate it with an empty array
      // const config = await sdk.points.getActionPointsConfig(tribeId);
      const config: PointsConfig[] = []; // Placeholder
      
      setPointsConfig(config);
    } catch (err) {
      console.error('Error fetching points configuration:', err);
      setError(`Failed to fetch points configuration: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!currentAction) {
      newErrors.action = 'Please select an action type';
    }
    
    if (!currentPoints.trim()) {
      newErrors.points = 'Points value is required';
    } else if (isNaN(Number(currentPoints)) || Number(currentPoints) < 0) {
      newErrors.points = 'Points must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddActionPoints = () => {
    if (!validateForm()) return;
    
    const points = Number(currentPoints);
    const existingIndex = pointsConfig.findIndex(item => item.actionType === currentAction);
    
    if (existingIndex >= 0) {
      // Update existing action
      const updatedConfig = [...pointsConfig];
      updatedConfig[existingIndex] = { actionType: currentAction, points };
      setPointsConfig(updatedConfig);
    } else {
      // Add new action
      setPointsConfig([...pointsConfig, { actionType: currentAction, points }]);
    }
    
    // Reset form
    setCurrentPoints('10');
    setSuccess(`Points updated for ${ACTION_TYPES.find(a => a.id === currentAction)?.name}`);
    
    // Clear success message after a delay
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };
  
  const handleRemoveActionPoints = (actionType: string) => {
    setPointsConfig(pointsConfig.filter(item => item.actionType !== actionType));
  };
  
  const handleSaveAllChanges = async () => {
    if (!sdk) {
      setError('SDK not initialized. Please connect your wallet first.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Save each action points configuration
      for (const config of pointsConfig) {
        // Use the correct SDK method for setting action points
        await sdk.points.setActionPoints({
          tribeId,
          actionType: config.actionType,
          points: config.points
        });
      }
      
      setSuccess('Points configuration saved successfully');
      
      // Notify parent component
      onUpdate();
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving points configuration:', err);
      setError(`Failed to save points configuration: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };
  
  const getActionNameById = (id: string): string => {
    return ACTION_TYPES.find(action => action.id === id)?.name || id;
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Configure Tribe Points</h2>
      
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-4">
          Configure how many points users earn for different actions in your tribe.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action Type</label>
            <select
              value={currentAction}
              onChange={(e) => setCurrentAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {ACTION_TYPES.map(action => (
                <option key={action.id} value={action.id}>{action.name}</option>
              ))}
            </select>
            {errors.action && (
              <p className="mt-1 text-xs text-red-500">{errors.action}</p>
            )}
          </div>
          
          <div>
            <Input
              label="Points"
              type="number"
              min="0"
              value={currentPoints}
              onChange={(e) => setCurrentPoints(e.target.value)}
              error={errors.points}
              fullWidth
            />
          </div>
          
          <div className="flex items-end">
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleAddActionPoints}
              className="w-full"
            >
              Add / Update
            </Button>
          </div>
        </div>
      </div>
      
      {pointsConfig.length > 0 ? (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Configured Actions</h3>
          
          <div className="border rounded-md divide-y">
            {pointsConfig.map((config, index) => (
              <div key={config.actionType} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium">{getActionNameById(config.actionType)}</p>
                  <p className="text-sm text-gray-600">Action type: {config.actionType}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">{config.points} points</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActionPoints(config.actionType)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              onClick={handleSaveAllChanges}
              isLoading={saving}
              disabled={saving || pointsConfig.length === 0}
            >
              Save All Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          {loading ? 'Loading...' : 'No actions configured. Add an action using the form above.'}
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-300 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}
    </Card>
  );
};

export default TribePointsForm; 