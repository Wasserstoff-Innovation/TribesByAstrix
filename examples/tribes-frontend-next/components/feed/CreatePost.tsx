import React, { useState } from 'react';
import { PostForm } from '../posts/PostForm';
import { Card, CardContent } from '../ui/Card';
import { useAstrixSDK } from '../../hooks/useAstrixSDK';
import { useToasts } from '../ui/Toast';

interface CreatePostProps {
  tribeId: number;
  onPostCreated?: (postId: number) => void;
}

export function CreatePost({ tribeId, onPostCreated }: CreatePostProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { sdk } = useAstrixSDK();
  const { showToast } = useToasts();

  // Handle post creation
  const handleSubmit = async (postData: {
    tribeId: number;
    postType: any;
    metadata: string;
    isGated?: boolean;
  }) => {
    if (!sdk) {
      showToast({
        type: 'error',
        message: 'SDK not initialized. Please connect your wallet first.',
        duration: 5000
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the SDK's content module to create a post
      const postId = await sdk.content.createPost({
        tribeId: postData.tribeId,
        metadata: postData.metadata,
        isGated: postData.isGated,
      });
      
      showToast({
        type: 'success',
        message: 'Post created successfully!',
        duration: 5000
      });
      
      // Call the onPostCreated callback if provided
      if (onPostCreated) {
        onPostCreated(postId);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      showToast({
        type: 'error',
        message: 'Failed to create post. Please try again.',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <PostForm
          tribeId={tribeId}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
} 