'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '../../../components/ui';
import { CreatePost } from '../../../components/feed/CreatePost';
import { Feed } from '../../../components/feed/Feed';
import { ToastProvider } from '../../../components/ui/Toast';
import PageContainer from '../../../components/ui/PageContainer';

// Type definitions
interface PostTypeMetadata {
  content?: string;
  format?: string;
  tags?: string[];
  mentions?: string[];
  mediaType?: string;
  mediaUrls?: string[];
  altText?: string;
  url?: string;
  title?: string;
  description?: string;
  previewImageUrl?: string;
  siteName?: string;
  question?: string;
  options?: string[];
  duration?: number;
  allowMultipleChoices?: boolean;
  startTime?: string;
  endTime?: string;
  location?: {
    type: string;
    url: string;
  };
  timezone?: string;
  reminders?: number[];
  summary?: string;
  details?: string;
  choices?: string[];
  startDate?: string;
  endDate?: string;
  requiredQuorum?: number;
  collectionName?: string;
  chain?: string;
  contractAddress?: string;
  tokenIds?: number[];
  marketplaceUrl?: string;
  author?: string;
  coverImageUrl?: string;
  readingTime?: number;
  tableOfContents?: string[];
}

interface PostType {
  id: string;
  name: string;
  description: string;
  badge: string;
  color: string;
  metadata: PostTypeMetadata;
}

// Define badge color theme constants to have a single source of truth
const BADGE_THEMES = {
  Basic: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-500',
    border: 'border-blue-500/40'
  },
  Media: {
    bg: 'bg-green-500/20',
    text: 'text-green-500',
    border: 'border-green-500/40'
  },
  Link: {
    bg: 'bg-purple-500/20',
    text: 'text-purple-500',
    border: 'border-purple-500/40'
  },
  Interactive: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-500',
    border: 'border-yellow-500/40'
  },
  Calendar: {
    bg: 'bg-red-500/20',
    text: 'text-red-500',
    border: 'border-red-500/40'
  },
  Governance: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-500',
    border: 'border-orange-500/40'
  },
  NFT: {
    bg: 'bg-teal-500/20',
    text: 'text-teal-500',
    border: 'border-teal-500/40'
  },
  Content: {
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-500',
    border: 'border-indigo-500/40'
  }
};

// Post types with their metadata schemas
const POST_TYPES: PostType[] = [
  {
    id: 'text',
    name: 'Text Post',
    description: 'A simple text post with optional formatting',
    badge: 'Basic',
    color: 'bg-blue-500',
    metadata: {
      content: 'This is a simple text post with #hashtags and @mentions',
      format: 'markdown',
      tags: ['announcement', 'general'],
      mentions: ['@astrix', '@user123']
    }
  },
  {
    id: 'image',
    name: 'Image Post',
    description: 'A post containing one or more images',
    badge: 'Media',
    color: 'bg-green-500',
    metadata: {
      content: 'Check out this amazing photo!',
      mediaType: 'image',
      mediaUrls: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg'
      ],
      tags: ['photo', 'nature'],
      altText: 'A beautiful mountain landscape'
    }
  },
  {
    id: 'link',
    name: 'Link Post',
    description: 'A post sharing a link with preview',
    badge: 'Link',
    color: 'bg-purple-500',
    metadata: {
      content: 'Interesting article about blockchain technology',
      url: 'https://example.com/article',
      title: 'The Future of Blockchain',
      description: 'An in-depth look at where blockchain is headed in 2023',
      previewImageUrl: 'https://example.com/preview.jpg',
      siteName: 'Crypto News'
    }
  },
  {
    id: 'poll',
    name: 'Poll Post',
    description: 'A post with a poll for community voting',
    badge: 'Interactive',
    color: 'bg-yellow-500',
    metadata: {
      question: 'What feature should we build next?',
      options: [
        'Enhanced NFT support',
        'Cross-chain messaging',
        'DAO governance tools',
        'Mobile app'
      ],
      duration: 604800, // 7 days in seconds
      allowMultipleChoices: false
    }
  },
  {
    id: 'event',
    name: 'Event Post',
    description: 'A post announcing an event with details',
    badge: 'Calendar',
    color: 'bg-red-500',
    metadata: {
      title: 'Community AMA Session',
      description: 'Join us for a live Ask-Me-Anything with the core team',
      startTime: '2023-10-15T18:00:00Z',
      endTime: '2023-10-15T19:30:00Z',
      location: {
        type: 'virtual',
        url: 'https://meet.example.com/event123'
      },
      timezone: 'UTC',
      reminders: [3600, 86400] // 1 hour and 1 day before in seconds
    }
  },
  {
    id: 'proposal',
    name: 'Governance Proposal',
    description: 'A formal proposal for community governance',
    badge: 'Governance',
    color: 'bg-orange-500',
    metadata: {
      title: 'Increase Token Rewards for Content Creators',
      summary: 'Proposal to increase token rewards allocated to content creators to incentivize quality content',
      details: 'Currently, content creators receive X tokens per post. This proposal suggests increasing that to Y tokens based on engagement metrics.',
      choices: ['Approve', 'Reject', 'Abstain'],
      startDate: '2023-10-20T00:00:00Z',
      endDate: '2023-10-27T00:00:00Z',
      requiredQuorum: 0.33
    }
  },
  {
    id: 'nft',
    name: 'NFT Showcase',
    description: 'A post showcasing NFT ownership or creation',
    badge: 'NFT',
    color: 'bg-teal-500',
    metadata: {
      title: 'My New NFT Collection',
      description: 'Check out my latest digital art collection',
      collectionName: 'Abstract Dimensions',
      chain: 'ethereum',
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      tokenIds: [42, 67, 89],
      previewImageUrl: 'https://example.com/nft-preview.jpg',
      marketplaceUrl: 'https://opensea.io/collection/abstract-dimensions'
    }
  },
  {
    id: 'article',
    name: 'Long-form Article',
    description: 'A comprehensive article with rich formatting',
    badge: 'Content',
    color: 'bg-indigo-500',
    metadata: {
      title: 'Complete Guide to Decentralized Finance',
      author: '@defi_expert',
      content: 'This would contain the full article in markdown format with sections, headings, etc.',
      coverImageUrl: 'https://example.com/defi-cover.jpg',
      readingTime: 12, // minutes
      tableOfContents: [
        'Introduction to DeFi',
        'Key DeFi Protocols',
        'Risk Management',
        'Future Trends'
      ],
      tags: ['defi', 'finance', 'blockchain', 'tutorial']
    }
  }
];

export default function FeedPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the selected post type data
  const selectedPostData = selectedType 
    ? POST_TYPES.find(type => type.id === selectedType) 
    : null;
  
  // Function to handle post creation
  const handlePostCreated = (postId: number) => {
    console.log(`Post created with ID: ${postId}`);
    // In a real app, you would fetch the post details and add to the posts state
    // For now, we'll just create a mock post
    const newPost = {
      id: `post-${postId}`,
      type: 'post',
      authorId: '0x1234...5678', // This would come from the connected wallet
      tribeId: '1',
      createdAt: new Date().toISOString(),
      content: 'New post created!',
      stats: {
        likes: 0,
        comments: 0,
        reposts: 0,
        saves: 0
      }
    };
    
    setPosts(prev => [newPost, ...prev]);
  };
  
  // Load some mock posts when the component mounts
  useEffect(() => {
    const mockPosts = [
      {
        id: 'post-1',
        type: 'post',
        authorId: '0xabcd...ef01',
        tribeId: '1',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        content: 'This is a sample post in the feed!',
        stats: {
          likes: 5,
          comments: 2,
          reposts: 1,
          saves: 0
        }
      },
      {
        id: 'post-2',
        type: 'post',
        authorId: '0x2345...6789',
        tribeId: '2',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        content: 'Another example post with some content.',
        stats: {
          likes: 12,
          comments: 3,
          reposts: 2,
          saves: 1
        }
      }
    ];
    
    setPosts(mockPosts);
  }, []);
  
  return (
    <ToastProvider position="bottom-right">
      <PageContainer className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="md:col-span-2 space-y-6">
            {/* Create post component */}
            <CreatePost tribeId={1} onPostCreated={handlePostCreated} />
            
            {/* Feed component */}
            <div className="bg-background rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Latest Posts</h2>
              <Feed items={posts} />
            </div>
          </div>
          
          {/* Sidebar with post types */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {POST_TYPES.map((type) => (
                    <div 
                      key={type.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors duration-200 ${
                        selectedType === type.id 
                          ? `bg-${type.badge.toLowerCase()}-500/20 border border-${type.badge.toLowerCase()}-500/40` 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedType(type.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{type.name}</span>
                        <Badge
                          variant="secondary"
                          className={BADGE_THEMES[type.badge as keyof typeof BADGE_THEMES].bg}
                        >
                          {type.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {type.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Selected post type details */}
            {selectedPostData && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedPostData.name} Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Metadata Schema</h3>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto">
                        {JSON.stringify(selectedPostData.metadata, null, 2)}
                      </pre>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Usage Example</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <div className="mb-2">
                          <Badge
                            variant="secondary"
                            className={BADGE_THEMES[selectedPostData.badge as keyof typeof BADGE_THEMES].bg}
                          >
                            {selectedPostData.badge}
                          </Badge>
                        </div>
                        
                        {selectedPostData.id === 'text' && (
                          <div className="text-sm">
                            <p className="font-medium">{selectedPostData.metadata.content}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedPostData.metadata.tags?.map((tag: string) => (
                                <span key={tag} className="text-xs text-blue-500">#{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedPostData.id === 'image' && (
                          <div className="text-sm">
                            <p>{selectedPostData.metadata.content}</p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {selectedPostData.metadata.mediaUrls?.map((url: string, idx: number) => (
                                <div key={idx} className="bg-gray-200 dark:bg-gray-700 h-20 rounded flex items-center justify-center text-xs text-gray-500">
                                  [Image {idx + 1}]
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedPostData.metadata.tags?.map((tag: string) => (
                                <span key={tag} className="text-xs text-green-500">#{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedPostData.id === 'link' && (
                          <div className="text-sm">
                            <p>{selectedPostData.metadata.content}</p>
                            <div className="mt-2 bg-gray-200 dark:bg-gray-700 p-2 rounded">
                              <p className="font-medium">{selectedPostData.metadata.title}</p>
                              <p className="text-xs">{selectedPostData.metadata.description}</p>
                              <p className="text-xs text-blue-500 mt-1">{selectedPostData.metadata.url}</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedPostData.id === 'poll' && (
                          <div className="text-sm">
                            <p className="font-medium">{selectedPostData.metadata.question}</p>
                            <div className="mt-2 space-y-1">
                              {selectedPostData.metadata.options?.map((option: string, idx: number) => (
                                <div key={idx} className="bg-gray-200 dark:bg-gray-700 p-2 rounded flex items-center">
                                  <div className="w-1 h-6 bg-yellow-500 mr-2"></div>
                                  <span>{option}</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs mt-2 text-gray-500">Poll duration: 7 days</p>
                          </div>
                        )}
                        
                        {selectedPostData.id === 'event' && (
                          <div className="text-sm">
                            <p className="font-medium">{selectedPostData.metadata.title}</p>
                            <p>{selectedPostData.metadata.description}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 w-20">Start:</span>
                                <span>{new Date(selectedPostData.metadata.startTime as string).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 w-20">End:</span>
                                <span>{new Date(selectedPostData.metadata.endTime as string).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs text-gray-500 w-20">Location:</span>
                                <span>{selectedPostData.metadata.location?.url}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Add other post type examples as needed */}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageContainer>
    </ToastProvider>
  );
} 