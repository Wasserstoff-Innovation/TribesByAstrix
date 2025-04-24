import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Repeat, Bookmark } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    title?: string;
    authorId: string;
    tribeId: string;
    createdAt: string;
    images?: string[];
    videos?: string[];
    links?: string[];
    hasLiked?: boolean;
    hasReposted?: boolean;
    hasSaved?: boolean;
    stats: {
      likes: number;
      comments: number;
      reposts: number;
      saves: number;
    };
  };
  currentUser?: string;
  tribeId?: string;
  tribeName?: string;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
}

export function PostCard({
  post,
  currentUser,
  tribeId,
  tribeName,
  onLike,
  onComment,
  onShare,
  onSave
}: PostCardProps) {
  // Format creation time
  const formattedTime = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  
  // Display author information
  const authorDisplay = post.authorId 
    ? `${post.authorId.substring(0, 6)}...${post.authorId.substring(post.authorId.length - 4)}`
    : 'Unknown';
    
  // Render media if available
  const renderMedia = () => {
    // Images
    if (post.images && post.images.length > 0) {
      if (post.images.length === 1) {
        return (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img 
              src={post.images[0]} 
              alt="Post content" 
              className="w-full h-auto max-h-96 object-cover"
            />
          </div>
        );
      } else {
        // Grid layout for multiple images
        return (
          <div className={`mt-3 grid grid-cols-${Math.min(post.images.length, 3)} gap-2`}>
            {post.images.map((img, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden">
                <img 
                  src={img} 
                  alt={`Post image ${idx + 1}`} 
                  className="w-full h-48 object-cover"
                />
              </div>
            ))}
          </div>
        );
      }
    }
    
    // Videos
    if (post.videos && post.videos.length > 0) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden">
          <video 
            src={post.videos[0]} 
            controls
            className="w-full h-auto"
          />
        </div>
      );
    }
    
    return null;
  };
  
  // Render links
  const renderLinks = () => {
    if (!post.links || post.links.length === 0) return null;
    
    return (
      <div className="mt-3">
        {post.links.map((link, idx) => (
          <a 
            key={idx}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-accent hover:underline text-sm truncate mb-1"
          >
            {link}
          </a>
        ))}
      </div>
    );
  };
  
  return (
    <div className="bg-card-dark p-4 rounded-lg shadow-sm border border-input-dark">
      {/* Post Header */}
      <div className="flex items-center mb-3">
        <div className="h-10 w-10 rounded-full bg-input-dark flex items-center justify-center text-foreground-dark font-bold">
          {authorDisplay[0]}
        </div>
        <div className="ml-2">
          <div className="font-medium text-foreground-dark">{authorDisplay}</div>
          <div className="text-xs text-muted-foreground flex">
            {formattedTime}
            {tribeName && tribeId && post.tribeId === tribeId && (
              <>
                <span className="mx-1">•</span>
                <span>{tribeName}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Post Title */}
      {post.title && (
        <h3 className="text-lg font-semibold mb-2 text-foreground-dark">{post.title}</h3>
      )}
      
      {/* Post Content */}
      <div className="text-foreground-dark whitespace-pre-line">
        {post.content}
      </div>
      
      {/* Media */}
      {renderMedia()}
      
      {/* Links */}
      {renderLinks()}
      
      {/* Post Stats */}
      <div className="flex items-center mt-4 text-muted-foreground text-sm">
        <div className="flex items-center">
          <span>{post.stats.likes || 0}</span>
          <span className="mx-1">likes</span>
        </div>
        <span className="mx-1.5">•</span>
        <div className="flex items-center">
          <span>{post.stats.comments || 0}</span>
          <span className="mx-1">comments</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-input-dark">
        <button 
          onClick={onLike}
          className={`flex items-center ${post.hasLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
        >
          <Heart className={`h-5 w-5 ${post.hasLiked ? 'fill-current' : ''}`} />
          <span className="ml-1.5 text-sm">{post.stats.likes > 0 ? post.stats.likes : ''}</span>
        </button>
        
        <button 
          onClick={onComment}
          className="flex items-center text-muted-foreground hover:text-accent"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="ml-1.5 text-sm">{post.stats.comments > 0 ? post.stats.comments : ''}</span>
        </button>
        
        <button 
          onClick={onShare}
          className={`flex items-center ${post.hasReposted ? 'text-green-500' : 'text-muted-foreground hover:text-green-500'}`}
        >
          <Repeat className="h-5 w-5" />
          <span className="ml-1.5 text-sm">{post.stats.reposts > 0 ? post.stats.reposts : ''}</span>
        </button>
        
        <button 
          onClick={onSave}
          className={`flex items-center ${post.hasSaved ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
        >
          <Bookmark className={`h-5 w-5 ${post.hasSaved ? 'fill-current' : ''}`} />
          <span className="ml-1.5 text-sm">{post.stats.saves > 0 ? post.stats.saves : ''}</span>
        </button>
      </div>
    </div>
  );
} 