import React from 'react';

interface FeedItem {
  id: string;
  type: 'post' | 'proposal' | 'bounty' | 'event' | 'nft' | 'project' | 'livestream' | 'poll';
  // Common fields for all feed items
  authorId: string;
  tribeId: string;
  createdAt: string;
  [key: string]: any; // Additional type-specific properties
}

interface Post {
  id: string;
  content: string;
  title?: string;
  authorId: string;
  tribeId: string;
  createdAt: string;
  metadata?: any;
  images?: string[];
  videos?: string[];
  links?: string[];
  stats: {
    likes: number;
    comments: number;
    reposts: number;
    saves: number;
  };
}

interface FeedProps {
  items: (FeedItem | Post)[];
  onItemClick?: (item: FeedItem | Post) => void;
}

export function Feed({ items, onItemClick }: FeedProps) {
  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-center rounded-lg bg-card-dark text-muted-foreground">
        <p>No content to display yet.</p>
        <p className="text-sm mt-2">Follow tribes or users to see their posts here.</p>
      </div>
    );
  }

  // This is a placeholder implementation - in a real app, we would implement
  // specific components for each feed item type
  const renderFeedItem = (item: FeedItem | Post) => {
    const handleClick = () => onItemClick?.(item);

    // Check if item is a Post
    if ('content' in item && 'metadata' in item) {
      return (
        <div 
          key={item.id} 
          onClick={handleClick}
          className="p-4 bg-card-dark rounded-lg cursor-pointer hover:bg-input-dark transition-colors"
        >
          <p className="text-foreground-dark">{item.content}</p>
          <div className="mt-2 text-sm text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      );
    }

    // Generic placeholder for other feed item types
    return (
      <div 
        key={item.id} 
        onClick={handleClick}
        className="p-4 bg-card-dark rounded-lg cursor-pointer hover:bg-input-dark transition-colors"
      >
        <div className="font-medium text-foreground-dark capitalize">
          {('type' in item) ? item.type : 'Post'}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString()}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {items.map(renderFeedItem)}
    </div>
  );
} 