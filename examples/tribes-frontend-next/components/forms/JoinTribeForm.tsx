import React, { useState } from 'react';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { Card, Button } from '../ui';

interface TribeInfo {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  members?: number;
  createdAt?: number;
}

interface JoinTribeFormProps {
  sdk: AstrixSDK | null;
  tribe: TribeInfo;
  isMember: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

const JoinTribeForm: React.FC<JoinTribeFormProps> = ({ 
  sdk, 
  tribe, 
  isMember, 
  onJoin, 
  onLeave 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinTribe = async () => {
    if (!sdk) {
      setError('SDK not initialized. Please connect your wallet first.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await sdk.tribes.joinTribe({
        tribeId: tribe.id
      });
      
      // Callback to refresh membership status
      onJoin();
    } catch (err) {
      console.error('Error joining tribe:', err);
      setError(`Failed to join tribe: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTribe = async () => {
    if (!sdk) {
      setError('SDK not initialized. Please connect your wallet first.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // await sdk.tribes.leaveTribe({
      //   tribeId: tribe.id
      // });
      
      // Callback to refresh membership status
      onLeave();
    } catch (err) {
      console.error('Error leaving tribe:', err);
      setError(`Failed to leave tribe: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-shrink-0">
          {tribe.logoUrl ? (
            <img 
              src={tribe.logoUrl} 
              alt={tribe.name} 
              className="w-24 h-24 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
              {tribe.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-grow text-center md:text-left">
          <h2 className="text-xl font-bold">{tribe.name}</h2>
          
          {tribe.description && (
            <p className="text-gray-600 mt-1">{tribe.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
            {tribe.members !== undefined && (
              <span className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                {tribe.members} {tribe.members === 1 ? 'member' : 'members'}
              </span>
            )}
            
            {tribe.createdAt && (
              <span className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                Created: {new Date(tribe.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0">
          {isMember ? (
            <Button
              variant="outline"
              onClick={handleLeaveTribe}
              isLoading={loading}
              disabled={loading}
            >
              Leave Tribe
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleJoinTribe}
              isLoading={loading}
              disabled={loading}
            >
              Join Tribe
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
    </Card>
  );
};

export default JoinTribeForm; 