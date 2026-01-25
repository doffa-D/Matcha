/**
 * Users API (Other Users)
 * 
 * Endpoints:
 * - GET  /users/:id        - View user profile
 * - POST /users/:id/like   - Like/Unlike user
 * - POST /users/:id/block  - Block user
 * - POST /users/:id/report - Report fake account
 * - GET  /browsing         - Get suggested profiles (matching algorithm)
 */

import api from '@/lib/api';
import type {
  UserProfile,
  LikeRequest,
  LikeResponse,
  BlockResponse,
  ReportResponse,
  BrowsingUser,
  BrowsingFilters,
  Pagination,
} from './types';

// =============================================================================
// VIEW USER PROFILE - Get another user's profile
// =============================================================================
/**
 * View another user's profile
 * - Records visit (visitor tracking)
 * - Returns relationship status (liked_by_me, liked_by_them, connected)
 * - Cannot view blocked users or your own profile
 * 
 * @param userId - Target user ID
 * @example
 * const { data: profile } = await getUserProfile(42);
 * if (profile.connected) {
 *   console.log('You are matched!');
 * }
 */
export const getUserProfile = (userId: number) =>
  api.get<UserProfile>(`/users/${userId}`);

// =============================================================================
// LIKE/UNLIKE USER - Toggle like status
// =============================================================================
/**
 * Like or unlike a user's profile
 * - like: true = like the user
 * - like: false = unlike the user
 * - Returns updated relationship status
 * 
 * @param userId - Target user ID
 * @param like - true to like, false to unlike
 * @example
 * // Like a user
 * const { data } = await toggleLike(42, true);
 * if (data.connected) {
 *   console.log("It's a match!");
 * }
 * 
 * // Unlike a user
 * await toggleLike(42, false);
 */
export const toggleLike = (userId: number, like: boolean) =>
  api.post<LikeResponse>(`/users/${userId}/like`, { like } as LikeRequest);

/**
 * Like a user (convenience wrapper)
 */
export const likeUser = (userId: number) => toggleLike(userId, true);

/**
 * Unlike a user (convenience wrapper)
 */
export const unlikeUser = (userId: number) => toggleLike(userId, false);

// =============================================================================
// BLOCK USER - Block from search/notifications/chat
// =============================================================================
/**
 * Block a user
 * - Hides user from search results
 * - Disables notifications from them
 * - Breaks any existing connection (removes mutual likes)
 * - Disables chat
 * 
 * @param userId - Target user ID
 * @example
 * await blockUser(42);
 */
export const blockUser = (userId: number) =>
  api.post<BlockResponse>(`/users/${userId}/block`);

// =============================================================================
// REPORT USER - Report fake account
// =============================================================================
/**
 * Report a user as "Fake Account"
 * - Stores report for moderation
 * - One report per user pair
 * 
 * @param userId - Target user ID
 * @example
 * await reportUser(42);
 */
export const reportUser = (userId: number) =>
  api.post<ReportResponse>(`/users/${userId}/report`);

// =============================================================================
// BROWSING - Get suggested profiles (Matching Algorithm)
// =============================================================================

interface BrowsingResponse {
  users: BrowsingUser[];
  pagination: Pagination;
}

/**
 * Get suggested profiles based on matching algorithm
 * 
 * Algorithm considers:
 * - Sexual orientation compatibility
 * - Geographic proximity
 * - Common interests (tags)
 * - Fame rating
 * 
 * @param filters - Optional filters and sorting
 * @example
 * // Get nearby users
 * const { data } = await getSuggestions({ 
 *   sort: 'distance',
 *   max_distance: 50 
 * });
 * 
 * // Get users with high fame, age 25-35
 * const { data } = await getSuggestions({
 *   sort: 'fame_rating',
 *   order: 'desc',
 *   min_age: 25,
 *   max_age: 35
 * });
 * 
 * // Filter by tags
 * const { data } = await getSuggestions({
 *   tags: '1,2,3', // Tag IDs separated by comma
 *   sort: 'common_tags'
 * });
 */
export const getSuggestions = (filters?: BrowsingFilters) =>
  api.get<BrowsingResponse>('/browsing', { params: filters });

/**
 * Get suggestions with pagination
 * 
 * @param page - Page number (1-based)
 * @param limit - Items per page (max 50)
 * @param filters - Additional filters
 */
export const getSuggestionsPaginated = (
  page: number = 1,
  limit: number = 20,
  filters?: Omit<BrowsingFilters, 'page' | 'limit'>
) =>
  getSuggestions({ ...filters, page, limit });

