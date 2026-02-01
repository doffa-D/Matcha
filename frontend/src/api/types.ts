/**
 * Shared TypeScript types for API requests and responses
 * These types match the backend Flask API response structures
 */

// =============================================================================
// USER TYPES
// =============================================================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  gender: 'Male' | 'Female' | null;
  sexual_preference: 'Straight' | 'Gay' | 'Bisexual' | null;
  location: Location | null;
  age: number | null;
  date_of_birth: string | null;
  fame_rating: number;
  is_verified: boolean;
  is_online?: boolean;
  last_online: string | null;
  created_at: string | null;
}

export interface Location {
  latitude: number | null;
  longitude: number | null;
}

// =============================================================================
// IMAGE TYPES
// =============================================================================

export interface Image {
  id: number;
  file_path: string;
  is_profile_pic?: boolean;
  created_at: string | null;
}

// =============================================================================
// TAG TYPES
// =============================================================================

export interface Tag {
  id: number;
  tag_name: string;
  created_at?: string | null;
}

// =============================================================================
// PROFILE TYPES (Current User)
// =============================================================================

export interface Visit {
  visitor_id: number;
  username: string;
  first_name: string;
  last_name: string;
  visit_count: number;
  last_visit: string | null;
}

export interface Like {
  liker_id: number;
  username: string;
  first_name: string;
  last_name: string;
  liked_at: string | null;
}

export interface ProfileStats {
  total_visits: number;
  total_likes: number;
}

export interface MyProfile extends User {
  images: Image[];
  tags: Tag[];
  visits: Visit[];
  likes: Like[];
  stats: ProfileStats;
}

// =============================================================================
// USER PROFILE TYPES (Other Users)
// =============================================================================

export interface UserProfile extends Omit<User, 'email'> {
  images: Image[];
  tags: Tag[];
  liked_by_me: boolean;
  liked_by_them: boolean;
  connected: boolean;
}

// =============================================================================
// BROWSING TYPES
// =============================================================================

export interface BrowsingUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  age: number | null;
  gender: string | null;
  bio: string | null;
  fame_rating: number;
  distance_km: number;
  common_tags_count: number;
  tags: string[];
  profile_image: string | null;
  is_online: boolean;
  last_online: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BrowsingFilters {
  sort?: 'distance' | 'age' | 'fame_rating' | 'common_tags';
  order?: 'asc' | 'desc';
  min_age?: number;
  max_age?: number;
  max_distance?: number;
  min_fame?: number;
  max_fame?: number;
  tags?: string;
  page?: number;
  limit?: number;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RegisterRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

// =============================================================================
// PROFILE UPDATE TYPES
// =============================================================================

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  gender?: 'Male' | 'Female';
  sexual_preference?: 'Straight' | 'Gay' | 'Bisexual';
  date_of_birth?: string;
  password?: string;
  current_password?: string;
}

export interface UpdateLocationRequest {
  latitude?: number;
  longitude?: number;
}

export interface LocationResponse {
  message: string;
  location: {
    latitude: number;
    longitude: number;
    source: 'gps' | 'ip';
  };
}

// =============================================================================
// IMAGE UPLOAD TYPES
// =============================================================================

export interface UploadedImage {
  id: number;
  file_path: string;
  filename: string;
}

export interface UploadImageResponse {
  message: string;
  uploaded_images: UploadedImage[];
  errors?: string[];
}

// =============================================================================
// LIKE/BLOCK/REPORT TYPES
// =============================================================================

export interface LikeRequest {
  like: boolean;
}

export interface LikeResponse {
  message: string;
  liked_by_me: boolean;
  liked_by_them: boolean;
  connected: boolean;
}

export interface BlockResponse {
  message: string;
  blocked: boolean;
  blocked_user_id?: number;
}

export interface ReportResponse {
  message: string;
  reported: boolean;
  reported_user_id?: number;
}

// =============================================================================
// TAGS TYPES
// =============================================================================

export interface TagsResponse {
  tags: Tag[];
  count: number;
}

export interface AddTagsRequest {
  tags: string[];
}

export interface AddTagsResponse {
  message: string;
  added_tags: Tag[];
  skipped_tags?: string[];
}

// =============================================================================
// GENERIC RESPONSE TYPES
// =============================================================================

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================
 
export interface ApiNotification {
  id: number;
  type: "like" | "visit" | "message" | "match" | "unlike";
  from_user: {
    id: number;
    username: string;
    first_name: string;
  };
  is_read: boolean;
  created_at: string;
}export interface NotificationsResponse {
  notifications: ApiNotification[];
}export interface UnreadCountResponse {
  unread_count: number;
}

// =============================================================================
// CHAT TYPES
// =============================================================================

export interface ConversationUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  is_online: boolean;
}

export interface LastMessage {
  content: string;
  created_at: string;
  is_mine: boolean;
}

export interface Conversation {
  user: ConversationUser;
  last_message: LastMessage | null;
  unread_count: number;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessagesResponse {
  messages: ChatMessage[];
  has_more: boolean;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  message: string;
  data: ChatMessage;
}

// =============================================================================
// DATE PROPOSAL TYPES
// =============================================================================

export interface DateProposal {
  id: number;
  sender_id: number;
  receiver_id: number;
  date_time: string;
  location: string;
  activity: string;
  status: 'pending' | 'accepted' | 'declined';
  is_mine: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDateProposalRequest {
  date_time: string;
  location: string;
  activity: string;
}

export interface CreateDateProposalResponse {
  message: string;
  data: DateProposal;
}

export interface RespondToDateRequest {
  status: 'accepted' | 'declined';
}

export interface RespondToDateResponse {
  message: string;
  data: {
    id: number;
    status: 'accepted' | 'declined';
  };
}

export interface DateProposalsResponse {
  proposals: DateProposal[];
}