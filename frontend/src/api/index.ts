/**
 * API Index - Barrel Export
 * 
 * Import all API functions from a single location:
 * import { login, getMyProfile, getSuggestions } from '@/api';
 */

// Re-export all types
export * from './types';

// Re-export all API modules
export * as auth from './auth';
export * as profile from './profile';
export * as users from './users';
export * as tags from './tags';
export * as notifications from './notifications';
export * as chat from './chat';
export * as dates from './dates';

// Also export individual functions for convenience
export {
  // Auth
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from './auth';

export {
  // Profile
  getMyProfile,
  updateProfile,
  updateLocation,
  uploadImages,
  deleteImage,
} from './profile';

export {
  // Users
  getUserProfile,
  toggleLike,
  likeUser,
  unlikeUser,
  blockUser,
  reportUser,
  getSuggestions,
  getSuggestionsPaginated,
} from './users';

export {
  // Tags
  getTags,
  addTags,
  addTag,
  removeTag,
} from './tags';

export {
  // Notifications
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notifications';

export {
  // Chat
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from './chat';

export {
  // Dates
  proposeDate,
  respondToDate,
  getDateProposals,
} from './dates';