/**
 * Tags API
 * 
 * Endpoints:
 * - GET    /tags      - Get all tags (public)
 * - POST   /tags      - Add tags to profile (auth required)
 * - DELETE /tags/:id  - Remove tag from profile (auth required)
 */

import api from '@/lib/api';
import type {
  Tag,
  TagsResponse,
  AddTagsRequest,
  AddTagsResponse,
  MessageResponse,
} from './types';

// =============================================================================
// GET ALL TAGS - List available tags (public endpoint)
// =============================================================================
/**
 * Get all available tags
 * Supports optional search query for autocomplete
 * 
 * @param search - Optional search query for filtering
 * @example
 * // Get all tags
 * const { data } = await getTags();
 * console.log(data.tags, data.count);
 * 
 * // Search tags
 * const { data } = await getTags('music');
 */
export const getTags = (search?: string) =>
  api.get<TagsResponse>('/tags', {
    params: search ? { q: search } : undefined,
  });

// =============================================================================
// ADD TAGS - Add tags to user profile
// =============================================================================
/**
 * Add tags to current user's profile
 * - Creates new tags if they don't exist
 * - Tags are automatically normalized (lowercase, # prefix)
 * - Skips tags already in profile
 * 
 * @param tags - Array of tag names
 * @example
 * const { data } = await addTags(['music', 'travel', '#photography']);
 * console.log(`Added ${data.added_tags.length} tags`);
 */
export const addTags = (tags: string[]) =>
  api.post<AddTagsResponse>('/tags', { tags } as AddTagsRequest);

// =============================================================================
// REMOVE TAG - Remove tag from profile
// =============================================================================
/**
 * Remove a tag from current user's profile
 * Does NOT delete the tag from the system (tags are reusable)
 * 
 * @param tagId - Tag ID to remove
 * @example
 * await removeTag(123);
 */
export const removeTag = (tagId: number) =>
  api.delete<MessageResponse>(`/tags/${tagId}`);

// =============================================================================
// HELPER: Add single tag
// =============================================================================
/**
 * Add a single tag to profile (convenience wrapper)
 * 
 * @param tag - Tag name
 * @example
 * await addTag('hiking');
 */
export const addTag = (tag: string) => addTags([tag]);

