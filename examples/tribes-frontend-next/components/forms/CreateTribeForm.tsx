import React, { useState } from 'react';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { Card, Button, Input } from '../ui';

interface CreateTribeFormProps {
  sdk: AstrixSDK | null;
  onCreated: () => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  tag: string;
  tags: string[];
  visibility: 'public' | 'private';
}

interface FormErrors {
  name?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

const CreateTribeForm: React.FC<CreateTribeFormProps> = ({ sdk, onCreated, onCancel }) => {
  const [formState, setFormState] = useState<FormState>({
    name: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    tag: '',
    tags: [],
    visibility: 'public'
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  
  const handleAddTag = () => {
    if (!formState.tag.trim()) return;
    
    if (!formState.tags.includes(formState.tag.trim())) {
      setFormState(prev => ({
        ...prev,
        tags: [...prev.tags, formState.tag.trim()],
        tag: ''
      }));
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formState.name.trim()) {
      newErrors.name = 'Tribe name is required';
    } else if (formState.name.length < 3) {
      newErrors.name = 'Tribe name must be at least 3 characters';
    }
    
    if (!formState.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formState.logoUrl && !isValidUrl(formState.logoUrl)) {
      newErrors.logoUrl = 'Please enter a valid URL';
    }
    
    if (formState.bannerUrl && !isValidUrl(formState.bannerUrl)) {
      newErrors.bannerUrl = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
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
      
      // Create tribe metadata
      const metadata = JSON.stringify({
        description: formState.description,
        logoUrl: formState.logoUrl,
        bannerUrl: formState.bannerUrl,
        tags: formState.tags,
        visibility: formState.visibility,
        createdAt: Date.now()
      });
      
      // Create the tribe using the SDK
      await sdk.tribes.createTribe({
        name: formState.name.trim(),
        metadata
      });
      
      // Callback to refresh tribes
      onCreated();
    } catch (err) {
      console.error('Error creating tribe:', err);
      setError(`Failed to create tribe: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Create New Tribe</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Input
              label="Tribe Name *"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              error={errors.name}
              fullWidth
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              rows={4}
              placeholder="Describe your tribe..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">{errors.description}</p>
            )}
          </div>
          
          <div>
            <Input
              label="Logo URL"
              name="logoUrl"
              value={formState.logoUrl}
              onChange={handleInputChange}
              error={errors.logoUrl}
              placeholder="https://example.com/logo.png"
              fullWidth
            />
          </div>
          
          <div>
            <Input
              label="Banner URL"
              name="bannerUrl"
              value={formState.bannerUrl}
              onChange={handleInputChange}
              error={errors.bannerUrl}
              placeholder="https://example.com/banner.png"
              fullWidth
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                name="tag"
                value={formState.tag}
                onChange={handleInputChange}
                placeholder="Add a tag"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleAddTag}
              >
                Add
              </Button>
            </div>
            
            {formState.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formState.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-gray-100 rounded-md text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button 
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Visibility</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formState.visibility === 'public'}
                  onChange={() => setFormState(prev => ({ ...prev, visibility: 'public' }))}
                  className="mr-2"
                />
                Public
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formState.visibility === 'private'}
                  onChange={() => setFormState(prev => ({ ...prev, visibility: 'private' }))}
                  className="mr-2"
                />
                Private
              </label>
            </div>
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
              Create Tribe
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};

export default CreateTribeForm; 