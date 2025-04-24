import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AstrixSDK } from '@wasserstoff/tribes-sdk';
import { Button, Card, Input } from './ui';
import TribeCard from './TribeCard';
import CreateTribeModal from './forms/CreateTribeModal';
import { getDefaultNetwork } from '../src/app/config/contracts';

interface TribesListPageProps {
  sdk?: AstrixSDK;
  isConnected: boolean;
  account: string | null;
  onConnect: () => Promise<void>;
}

export const TribesListPage: React.FC<TribesListPageProps> = ({
  sdk,
  isConnected,
  account,
  onConnect
}) => {
  const [tribes, setTribes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [memberTribes, setMemberTribes] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  
  // Fetch tribes when SDK is available
  useEffect(() => {
    if (sdk) {
      fetchTribes();
    }
  }, [sdk]);
  
  // Fetch member tribes when account changes
  useEffect(() => {
    if (sdk && account) {
      fetchMemberTribes();
    }
  }, [sdk, account]);
  
  const fetchTribes = async () => {
    if (!sdk) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const tribesList = await sdk.tribes.getAllTribes();
      // Assuming tribesList has a structure like { tribeIds: number[], total: number }
      const formattedTribes = tribesList.tribeIds.map((id: number) => ({
        id,
        name: `Tribe ${id}`,
        // Other properties will be fetched individually or in a batch
      }));
      
      setTribes(formattedTribes);
    } catch (err) {
      console.error('Error fetching tribes:', err);
      setError('Failed to fetch tribes. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMemberTribes = async () => {
    if (!sdk || !account) return;
    
    try {
      // Get all tribes first
      const allTribes = await sdk.tribes.getAllTribes();
      
      // Check each tribe for membership if allTribes has the expected structure
      if (allTribes && allTribes.tribeIds) {
        const membershipChecks = await Promise.all(
          allTribes.tribeIds.map(async (tribeId: number) => {
            try {
              const members = await sdk.tribes.getMembers(tribeId);
              return { 
                id: tribeId, 
                isMember: members.some((m: string) => 
                  m.toLowerCase() === account.toLowerCase()
                )
              };
            } catch (e) {
              return { id: tribeId, isMember: false };
            }
          })
        );
        
        // Filter to get only tribes where user is a member
        const memberTribesIds = membershipChecks
          .filter(result => result.isMember)
          .map(result => result.id);
        
        setMemberTribes(memberTribesIds);
      }
    } catch (err) {
      console.error('Error fetching member tribes:', err);
    }
  };
  
  const handleJoinTribe = async (tribeId: number) => {
    if (!sdk || !isConnected) {
      onConnect();
      return;
    }
    
    try {
      setLoading(true);
      await sdk.tribes.joinTribe({
        tribeId
      });
      
      // Refresh member tribes
      await fetchMemberTribes();
      
      setLoading(false);
    } catch (err) {
      console.error('Error joining tribe:', err);
      setError('Failed to join tribe. Please try again.');
      setLoading(false);
    }
  };
  
  const handleTribeCreated = async () => {
    // Close the create modal
    setShowCreateModal(false);
    
    // Refresh tribes
    await fetchTribes();
    await fetchMemberTribes();
  };
  
  // Filter tribes based on search term
  const filteredTribes = tribes.filter(tribe => 
    tribe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tribes</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Discover and join tribes on {getDefaultNetwork().name}
          </p>
        </div>
        
        <Button 
          variant="primary" 
          onClick={() => setShowCreateModal(true)}
          disabled={!isConnected}
          className="px-6"
        >
          Create Tribe
        </Button>
      </div>
      
      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <Input
            placeholder="Search tribes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            fullWidth
          />
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 rounded-md bg-red-50 border border-red-200 text-red-800">
          {error}
        </div>
      )}
      
      {/* Tribes List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredTribes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTribes.map((tribe) => (
            <TribeCard
              key={tribe.id}
              tribe={tribe}
              isMember={memberTribes.includes(tribe.id)}
              onJoin={() => handleJoinTribe(tribe.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-2">No tribes found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? `No results match "${searchTerm}"` : 'Create a new tribe to get started!'}
            </p>
            
            {!isConnected && (
              <Button 
                variant="primary" 
                onClick={onConnect}
                className="px-6"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </Card>
      )}
      
      {/* Update the Create Tribe Modal */}
      <CreateTribeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleTribeCreated}
        sdk={sdk || null}
      />
    </div>
  );
};

export default TribesListPage; 