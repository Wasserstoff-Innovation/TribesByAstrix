import React, { useState, useEffect } from 'react';
// Remove the PostType import
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Tabs } from '../ui/Tabs';

// Define enum for PostType since we can't import it directly
enum PostType {
  TEXT = 'TEXT',
  RICH_MEDIA = 'RICH_MEDIA',
  EVENT = 'EVENT',
  POLL = 'POLL',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  COMMUNITY_UPDATE = 'COMMUNITY_UPDATE',
  ENCRYPTED = 'ENCRYPTED'
}

// Define metadata interfaces for different post types
interface BasePostMetadata {
  content: string;
  title?: string;
  tags?: string[];
}

interface TextPostMetadata extends BasePostMetadata {
  format?: 'plain' | 'markdown';
  mentions?: string[];
}

interface MediaPostMetadata extends BasePostMetadata {
  mediaUrls: string[];
  mediaType: 'image' | 'video' | 'audio';
  altText?: string;
}

interface LinkPostMetadata extends BasePostMetadata {
  url: string;
  previewImageUrl?: string;
  siteName?: string;
  description?: string;
}

interface PollPostMetadata extends BasePostMetadata {
  question: string;
  options: string[];
  duration: number; // in seconds
  allowMultipleChoices?: boolean;
}

interface EventPostMetadata extends BasePostMetadata {
  startTime: string;
  endTime?: string;
  location?: {
    type: string;
    url?: string;
    address?: string;
  };
  timezone?: string;
  reminders?: number[]; // seconds before event
}

type PostMetadata = 
  | TextPostMetadata 
  | MediaPostMetadata 
  | LinkPostMetadata 
  | PollPostMetadata 
  | EventPostMetadata;

interface PostFormProps {
  tribeId: number;
  onSubmit: (postData: {
    tribeId: number;
    postType: PostType;
    metadata: string; // JSON stringified metadata
    isGated?: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function PostForm({ tribeId, onSubmit, isLoading = false }: PostFormProps) {
  // State for form
  const [postType, setPostType] = useState<PostType>(PostType.TEXT);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isGated, setIsGated] = useState(false);
  
  // Media specific state
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio'>('image');
  
  // Link specific state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreviewImage, setLinkPreviewImage] = useState('');
  
  // Poll specific state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState(604800); // Default 7 days
  
  // Event specific state
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventLocationType, setEventLocationType] = useState<'virtual' | 'physical'>('virtual');

  // Clear form fields when post type changes
  useEffect(() => {
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setMediaUrls([]);
    setMediaInput('');
    setLinkUrl('');
    setLinkPreviewImage('');
    setPollQuestion('');
    setPollOptions(['', '']);
    setEventStartTime('');
    setEventEndTime('');
    setEventLocation('');
  }, [postType]);

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Add media URL
  const addMediaUrl = () => {
    if (mediaInput.trim() && !mediaUrls.includes(mediaInput.trim())) {
      setMediaUrls([...mediaUrls, mediaInput.trim()]);
      setMediaInput('');
    }
  };

  // Remove media URL
  const removeMediaUrl = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  // Add poll option
  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  // Update poll option
  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Remove poll option
  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Prepare metadata based on post type
  const prepareMetadata = (): PostMetadata => {
    const baseMetadata: BasePostMetadata = {
      content,
      title: title || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    switch (postType) {
      case PostType.TEXT:
        return {
          ...baseMetadata,
          format: 'plain',
        };
      case PostType.RICH_MEDIA:
        return {
          ...baseMetadata,
          mediaUrls,
          mediaType,
        };
      case PostType.POLL:
        return {
          ...baseMetadata,
          question: pollQuestion,
          options: pollOptions.filter(option => option.trim() !== ''),
          duration: pollDuration,
        };
      case PostType.EVENT:
        return {
          ...baseMetadata,
          startTime: eventStartTime,
          endTime: eventEndTime || undefined,
          location: eventLocation ? {
            type: eventLocationType,
            url: eventLocationType === 'virtual' ? eventLocation : undefined,
            address: eventLocationType === 'physical' ? eventLocation : undefined,
          } : undefined,
        };
      default:
        return baseMetadata;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!content.trim()) {
      alert('Content is required');
      return;
    }

    // Additional validation based on post type
    if (postType === PostType.RICH_MEDIA && mediaUrls.length === 0) {
      alert('At least one media URL is required for media posts');
      return;
    }
    
    if (postType === PostType.POLL) {
      if (!pollQuestion.trim()) {
        alert('Poll question is required');
        return;
      }
      
      const validOptions = pollOptions.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) {
        alert('At least two poll options are required');
        return;
      }
    }
    
    if (postType === PostType.EVENT && !eventStartTime) {
      alert('Event start time is required');
      return;
    }

    const metadata = prepareMetadata();
    
    try {
      await onSubmit({
        tribeId,
        postType,
        metadata: JSON.stringify(metadata),
        isGated,
      });
      
      // Reset form after successful submission
      setContent('');
      setTitle('');
      setTags([]);
      setMediaUrls([]);
      setPollQuestion('');
      setPollOptions(['', '']);
      setEventStartTime('');
      setEventEndTime('');
      setEventLocation('');
      setIsGated(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  // Render different form fields based on post type
  const renderPostTypeFields = () => {
    switch (postType) {
      case PostType.RICH_MEDIA:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Media Type</label>
              <select 
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'image' | 'video' | 'audio')}
                className="w-full p-2 rounded border border-input bg-background text-foreground"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Media URLs</label>
              <div className="flex">
                <Input 
                  value={mediaInput}
                  onChange={(e) => setMediaInput(e.target.value)}
                  placeholder="Enter media URL"
                  className="flex-1 mr-2"
                />
                <Button onClick={addMediaUrl} type="button" variant="outline">Add</Button>
              </div>
              
              {mediaUrls.length > 0 && (
                <div className="mt-2 space-y-2">
                  {mediaUrls.map((url, index) => (
                    <div key={index} className="flex items-center">
                      <span className="flex-1 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeMediaUrl(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        
      case PostType.POLL:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Poll Question</label>
              <Input 
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Poll Options</label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <Input 
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 mr-2"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePollOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              
              <Button 
                onClick={addPollOption} 
                type="button" 
                variant="outline" 
                className="mt-2 w-full"
              >
                Add Option
              </Button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Poll Duration</label>
              <select 
                value={pollDuration}
                onChange={(e) => setPollDuration(Number(e.target.value))}
                className="w-full p-2 rounded border border-input bg-background text-foreground"
              >
                <option value="86400">1 day</option>
                <option value="259200">3 days</option>
                <option value="604800">7 days</option>
                <option value="1209600">14 days</option>
                <option value="2592000">30 days</option>
              </select>
            </div>
          </div>
        );
        
      case PostType.EVENT:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Start Time</label>
              <Input 
                type="datetime-local"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Event End Time (Optional)</label>
              <Input 
                type="datetime-local"
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Location Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locationType"
                    value="virtual"
                    checked={eventLocationType === 'virtual'}
                    onChange={() => setEventLocationType('virtual')}
                    className="mr-2"
                  />
                  Virtual
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="locationType"
                    value="physical"
                    checked={eventLocationType === 'physical'}
                    onChange={() => setEventLocationType('physical')}
                    className="mr-2"
                  />
                  Physical
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {eventLocationType === 'virtual' ? 'Meeting URL' : 'Address'}
              </label>
              <Input 
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder={eventLocationType === 'virtual' ? 'https://...' : 'Physical address'}
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Tabs
            items={[
              { 
                id: 'text', 
                label: 'Text',
                content: null
              },
              { 
                id: 'media', 
                label: 'Media',
                content: null
              },
              { 
                id: 'poll', 
                label: 'Poll',
                content: null
              },
              { 
                id: 'event', 
                label: 'Event',
                content: null
              }
            ]}
            defaultTab={
              postType === PostType.TEXT ? 'text' :
              postType === PostType.RICH_MEDIA ? 'media' :
              postType === PostType.POLL ? 'poll' :
              postType === PostType.EVENT ? 'event' : 'text'
            }
            onChange={(id) => {
              setPostType(
                id === 'text' ? PostType.TEXT :
                id === 'media' ? PostType.RICH_MEDIA :
                id === 'poll' ? PostType.POLL :
                id === 'event' ? PostType.EVENT : PostType.TEXT
              );
            }}
          />
          
          <div>
            <label className="block text-sm font-medium mb-1">Title (Optional)</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title to your post"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-2 min-h-[100px] rounded border border-input bg-background text-foreground"
              required
            />
          </div>
          
          {/* Post type specific fields */}
          {renderPostTypeFields()}
          
          <div>
            <label className="block text-sm font-medium mb-1">Tags (Optional)</label>
            <div className="flex">
              <Input 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags"
                className="flex-1 mr-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button onClick={addTag} type="button" variant="outline">Add</Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <div 
                    key={index}
                    className="bg-accent/20 text-accent px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 text-foreground-muted hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isGated"
              checked={isGated}
              onChange={(e) => setIsGated(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isGated" className="text-sm">Gate this post (require token ownership)</label>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating Post...' : 'Create Post'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 