import React, { useState } from 'react';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { Card, Button, Input } from '../ui';

interface CreateTokenFormProps {
  sdk: AstrixSDK | null;
  tribeId: number;
  onCreated: () => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  symbol: string;
  exchangeRate: string; // String for input, will convert to number
}

interface FormErrors {
  name?: string;
  symbol?: string;
  exchangeRate?: string;
}

const CreateTokenForm: React.FC<CreateTokenFormProps> = ({ 
  sdk, 
  tribeId, 
  onCreated, 
  onCancel 
}) => {
  const [formState, setFormState] = useState<FormState>({
    name: '',
    symbol: '',
    exchangeRate: '100'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formState.name.trim()) {
      newErrors.name = 'Token name is required';
    }
    
    if (!formState.symbol.trim()) {
      newErrors.symbol = 'Token symbol is required';
    } else if (formState.symbol.length > 5) {
      newErrors.symbol = 'Token symbol should be 5 characters or less';
    }
    
    if (!formState.exchangeRate.trim()) {
      newErrors.exchangeRate = 'Exchange rate is required';
    } else if (isNaN(Number(formState.exchangeRate)) || Number(formState.exchangeRate) <= 0) {
      newErrors.exchangeRate = 'Exchange rate must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sdk) {
      setError('SDK not initialized. Please connect your wallet first.');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create the token - use the correct SDK method
      await sdk.points.createTribeToken({
        tribeId,
        name: formState.name.trim(),
        symbol: formState.symbol.trim().toUpperCase()
      });
      
      // Set exchange rate if needed - use the correct SDK method
      if (formState.exchangeRate.trim()) {
        await sdk.points.setExchangeRate({
          tribeId,
          rate: Number(formState.exchangeRate)
        });
      }
      
      // Callback to refresh token information
      onCreated();
    } catch (err) {
      console.error('Error creating token:', err);
      setError(`Failed to create token: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Create Tribe Token</h2>
      
      <p className="text-sm text-gray-600 mb-4">
        Create a custom ERC20 token for your tribe. This token can be used for rewards, governance, and more.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Input
              label="Token Name *"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              placeholder="Awesome Token"
              error={errors.name}
              fullWidth
            />
          </div>
          
          <div>
            <Input
              label="Token Symbol *"
              name="symbol"
              value={formState.symbol}
              onChange={handleInputChange}
              placeholder="AWE"
              error={errors.symbol}
              fullWidth
            />
            <p className="mt-1 text-xs text-gray-500">
              Token symbol should be 5 characters or less (e.g., BTC, ETH, USDC)
            </p>
          </div>
          
          <div>
            <Input
              label="Exchange Rate *"
              name="exchangeRate"
              type="number"
              min="1"
              value={formState.exchangeRate}
              onChange={handleInputChange}
              error={errors.exchangeRate}
              fullWidth
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of tribe tokens per 1 Astrix token
            </p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              isLoading={loading}
              disabled={loading}
            >
              Create Token
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default CreateTokenForm; 