import React from 'react';
import { Card, Button } from './ui';

export interface TribeCardProps {
  tribe: {
    id: number;
    name: string;
    metadata?: string;
    memberCount?: number;
    admin?: string;
  };
  isMember: boolean;
  onJoin: () => Promise<void>;
}

const TribeCard: React.FC<TribeCardProps> = ({ tribe, isMember, onJoin }) => {
  const { id, name, metadata, memberCount } = tribe;
  
  // Parse metadata if it exists
  const parsedMetadata = React.useMemo(() => {
    if (!metadata) return { description: '', logoUrl: '', bannerUrl: '', createdAt: Date.now() };
    try {
      return JSON.parse(metadata);
    } catch (e) {
      console.error('Error parsing tribe metadata:', e);
      return { description: '', logoUrl: '', bannerUrl: '', createdAt: Date.now() };
    }
  }, [metadata]);
  
  const { description, logoUrl, bannerUrl, createdAt } = parsedMetadata;
  const creationDate = new Date(createdAt).toLocaleDateString();
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Banner */}
      <div 
        className="w-full h-24 bg-gradient-to-r from-primary-dark to-primary-light relative"
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      />
      
      {/* Content */}
      <div className="p-4">
        {/* Logo and Basic Info */}
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0 border-2 border-white shadow-sm" style={{ marginTop: '-20px' }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${name}`}
                className="w-full h-full object-cover bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary text-xl font-bold">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-500">
              {memberCount !== undefined ? `${memberCount} members` : 'Members unknown'} • Created {creationDate}
            </p>
          </div>
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{description}</p>
        )}
        
        {/* Action Button */}
        <div className="mt-4 flex justify-end">
          <Button
            variant={isMember ? "outline" : "primary"}
            onClick={onJoin}
            className="px-6"
          >
            {isMember ? 'Leave Tribe' : 'Join Tribe'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TribeCard; 