/**
 * Profile API (Current User)
 *
 * Endpoints:
 * - GET    /profile/me           - Get my profile
 * - PUT    /profile/update       - Update profile fields
 * - PUT    /profile/location     - Update GPS location
 * - POST   /profile/upload       - Upload images
 * - DELETE /profile/images/:id   - Delete image
 */

import api from "@/lib/api";
import type {
  MyProfile,
  UpdateProfileRequest,
  UpdateLocationRequest,
  LocationResponse,
  UploadImageResponse,
  MessageResponse,
} from "./types";

// =============================================================================
// GET MY PROFILE - Full profile with images, tags, visits, likes
// =============================================================================
/**
 * Get current user's complete profile
 * Includes: images, tags, visits (who viewed me), likes (who liked me), stats
 *
 * @example
 * const { data: profile } = await getMyProfile();
 * console.log(profile.username, profile.stats.total_likes);
 */
export const getMyProfile = () => api.get<MyProfile>("/profile/me");

// =============================================================================
// UPDATE PROFILE - Update user fields
// =============================================================================
/**
 * Update profile information
 * Supports: first_name, last_name, email, bio, gender, sexual_preference,
 *           date_of_birth, password (requires current_password)
 *
 * @example
 * // Update bio
 * await updateProfile({ bio: 'Hello world!' });
 *
 * // Change password
 * await updateProfile({
 *   password: 'newPassword123',
 *   current_password: 'oldPassword123'
 * });
 */
export const updateProfile = (data: UpdateProfileRequest) =>
  api.put<MessageResponse>("/profile/update", data);

// =============================================================================
// UPDATE LOCATION - GPS or IP-based
// =============================================================================
/**
 * Update user location
 * - With coordinates: Uses provided GPS
 * - Without coordinates: Falls back to IP geolocation
 *
 * @example
 * // Use GPS coordinates
 * await updateLocation({ latitude: 48.8566, longitude: 2.3522 });
 *
 * // Use IP geolocation (empty body)
 * await updateLocation({});
 */
export const updateLocation = (data?: UpdateLocationRequest) =>
  api.put<LocationResponse>("/profile/location", data || {});

// =============================================================================
// UPLOAD IMAGES - Single or multiple files
// =============================================================================
/**
 * Upload profile images (max 5 total)
 * Accepts: jpg, jpeg, png, gif, webp (max 5MB each)
 *
 * @param files - File(s) to upload
 * @example
 * // Single file
 * const input = document.querySelector('input[type="file"]');
 * await uploadImages(input.files[0]);
 *
 * // Multiple files
 * await uploadImages(input.files);
 */
export const uploadImages = (files: File | FileList) => {
  const formData = new FormData();

  if (files instanceof FileList) {
    // Multiple files
    Array.from(files).forEach((file) => {
      formData.append("file", file);
    });
  } else {
    // Single file
    formData.append("file", files);
  }

  // Note: Don't set Content-Type header - browser sets it automatically with boundary
  return api.post<UploadImageResponse>("/profile/upload", formData);
};

// =============================================================================
// DELETE IMAGE - Remove by ID
// =============================================================================
/**
 * Delete a profile image
 *
 * @param imageId - Image ID to delete
 * @example
 * await deleteImage(123);
 */
export const deleteImage = (imageId: number) =>
  api.delete<MessageResponse>(`/profile/images/${imageId}`);

// =============================================================================
// SET PROFILE IMAGE - Set as main profile picture
// =============================================================================
/**
 * Set an image as the profile picture
 * Only one image can be the profile picture at a time
 *
 * @param imageId - Image ID to set as profile picture
 * @example
 * await setProfileImage(123);
 */
export const setProfileImage = (imageId: number) =>
  api.put<MessageResponse>(`/profile/images/${imageId}/set-profile`);
