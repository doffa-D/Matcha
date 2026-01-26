import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  User,
  Mail,
  MapPin,
  Camera,
  X,
  Plus,
  Save,
  LogOut,
  Eye,
  Heart,
  Navigation,
  Edit3,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/protected-route";
import Button from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FameIndicator } from "@/components/ui/fame-indicator";
import {
  useAuth,
  checkProfileCompleteness,
  type ProfileCompleteness,
} from "@/context";
import { getImageUrl } from "@/lib/utils";
import {
  getMyProfile,
  updateProfile as apiUpdateProfile,
  uploadImages,
  deleteImage,
  setProfileImage,
  updateLocation,
} from "@/api/profile";
import { addTags, removeTag } from "@/api/tags";
import {
  requestGPSPermission,
  getGeolocationErrorMessage,
  isGeolocationSupported,
} from "@/lib/geolocation";
import type {
  MyProfile as ApiMyProfile,
  UpdateProfileRequest,
} from "@/api/types";

interface SearchParams {
  incomplete?: string;
}

export const Route = createFileRoute("/me/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      incomplete: search?.incomplete as string | undefined,
    };
  },
  component: () => (
    <ProtectedRoute>
      <MyProfilePage />
    </ProtectedRoute>
  ),
});

// --- Types ---
interface PhotoSlot {
  id: number | null;
  url: string | null;
  isProfilePic: boolean;
}

interface MyProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: "Male" | "Female" | "";
  sexualPreferences: "Straight" | "Bisexual" | "Gay" | "";
  bio: string;
  tags: string[];
  photos: PhotoSlot[];
  profilePhotoIndex: number;
  fameRating: number;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
    isAutoDetected: boolean;
  };
  gpsEnabled: boolean;
}

// Image upload validation constants
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

interface ProfileVisitor {
  id: string;
  username: string;
  name: string;
  visitedAt: string;
}

interface ProfileLiker {
  id: string;
  username: string;
  name: string;
  likedAt: string;
}

// --- Helper Functions ---
const formatTimeAgo = (date: string | null): string => {
  if (!date) return "Unknown";

  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return past.toLocaleDateString();
};

// Transform API data to component format
const transformApiProfile = (apiProfile: ApiMyProfile): MyProfile => {
  // Ensure we have exactly 5 photo slots with id, url, and profile pic status
  const photos: PhotoSlot[] = [...Array(MAX_IMAGES)].map((_, i) => {
    const image = apiProfile.images[i];
    return {
      id: image?.id || null,
      url: getImageUrl(image?.file_path),
      isProfilePic: image?.is_profile_pic || false,
    };
  });

  // Find which index is the profile photo
  const profilePhotoIndex = photos.findIndex((p) => p.isProfilePic);

  return {
    id: String(apiProfile.id),
    username: apiProfile.username,
    firstName: apiProfile.first_name,
    lastName: apiProfile.last_name,
    email: apiProfile.email,
    gender: apiProfile.gender || "",
    sexualPreferences: apiProfile.sexual_preference || "",
    bio: apiProfile.bio || "",
    tags: apiProfile.tags.map((t) => t.tag_name),
    photos,
    profilePhotoIndex: profilePhotoIndex >= 0 ? profilePhotoIndex : 0,
    fameRating: apiProfile.fame_rating * 20, // Convert 0-5 to 0-100
    location: {
      lat: apiProfile.location?.latitude || 0,
      lng: apiProfile.location?.longitude || 0,
      city: "Unknown", // API doesn't return city name yet
      country: "Unknown", // API doesn't return country name yet
      isAutoDetected: !!apiProfile.location,
    },
    gpsEnabled: !!apiProfile.location,
  };
};

// Validate image file
const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: JPG, PNG, GIF, WebP`;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `File too large. Maximum size: 5MB`;
  }
  return null;
};

const transformVisitors = (apiProfile: ApiMyProfile): ProfileVisitor[] => {
  return apiProfile.visits.map((visit) => ({
    id: String(visit.visitor_id),
    username: visit.username,
    name: `${visit.first_name} ${visit.last_name}`,
    visitedAt: formatTimeAgo(visit.last_visit),
  }));
};

const transformLikers = (apiProfile: ApiMyProfile): ProfileLiker[] => {
  return apiProfile.likes.map((like) => ({
    id: String(like.liker_id),
    username: like.username,
    name: `${like.first_name} ${like.last_name}`,
    likedAt: formatTimeAgo(like.liked_at),
  }));
};

const AVAILABLE_TAGS = [
  "travel",
  "hiking",
  "photography",
  "coffee",
  "dogs",
  "cats",
  "art",
  "music",
  "cooking",
  "fitness",
  "reading",
  "movies",
  "gaming",
  "yoga",
  "dancing",
  "coding",
  "nature",
  "beach",
  "mountains",
  "wine",
];

// Profile completeness status indicator component
function ProfileCompletenessIndicator({
  completeness,
}: {
  completeness: ProfileCompleteness;
}) {
  const items = [
    { label: "Gender", complete: completeness.hasGender },
    { label: "Sexual preference", complete: completeness.hasSexualPreference },
    { label: "Biography", complete: completeness.hasBio },
    { label: "At least 1 interest tag", complete: completeness.hasTag },
    { label: "At least 1 profile picture", complete: completeness.hasImage },
  ];

  return (
    <div className="space-y-2">
      {items.map(({ label, complete }) => (
        <div key={label} className="flex items-center gap-2 text-sm">
          {complete ? (
            <CheckCircle2 className="w-4 h-4 text-matcha shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <span
            className={
              complete ? "text-neutral-600" : "text-amber-700 font-medium"
            }
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function MyProfilePage() {
  const { logout, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<MyProfile | null>(null);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Get search params to check if redirected due to incomplete profile
  const { incomplete } = Route.useSearch();

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Location state
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  // Fetch profile data
  const {
    data: apiProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const response = await getMyProfile();
      return response.data;
    },
  });

  // Transform API data
  const profile = apiProfile ? transformApiProfile(apiProfile) : null;
  const visitors = apiProfile ? transformVisitors(apiProfile) : [];
  const likers = apiProfile ? transformLikers(apiProfile) : [];

  

  // Check profile completeness
  const profileCompleteness = apiProfile
    ? checkProfileCompleteness(apiProfile)
    : null;
  const isProfileComplete = profileCompleteness?.isComplete ?? false;

  // Image upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await uploadImages(file);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      refreshProfile(); // Update auth context
      setImageError(null);
    },
    onError: (error: any) => {
      const message =
        error?.data?.error || error?.message || "Failed to upload image";
      setImageError(message);
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await deleteImage(imageId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      refreshProfile(); // Update auth context
      setImageError(null);
    },
    onError: (error: any) => {
      const message =
        error?.data?.error || error?.message || "Failed to delete image";
      setImageError(message);
    },
  });

  // Set profile image mutation
  const setProfileMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await setProfileImage(imageId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      refreshProfile(); // Update auth context
      setImageError(null);
    },
    onError: (error: any) => {
      const message =
        error?.data?.error || error?.message || "Failed to set profile image";
      setImageError(message);
    },
  });

  const handleSave = async () => {
    if (!editedProfile || !apiProfile || isSaving) return;

    setIsSaving(true);

    // Map component format to API format
    const updateData: UpdateProfileRequest = {
      first_name: editedProfile.firstName,
      last_name: editedProfile.lastName,
      email: editedProfile.email,
      bio: editedProfile.bio,
      gender: editedProfile.gender || undefined,
      sexual_preference: editedProfile.sexualPreferences || undefined,
    };

    // Calculate tag changes
    const originalTags = apiProfile.tags.map((t) => t.tag_name);
    const editedTags = editedProfile.tags;

    // Tags to add (in edited but not in original)
    const tagsToAdd = editedTags.filter((tag) => !originalTags.includes(tag));

    // Tags to remove (in original but not in edited)
    const tagsToRemove = apiProfile.tags.filter(
      (t) => !editedTags.includes(t.tag_name),
    );

    try {
      // Update profile fields
      await apiUpdateProfile(updateData);

      // Add new tags
      if (tagsToAdd.length > 0) {
        await addTags(tagsToAdd);
      }

      // Remove deleted tags
      for (const tag of tagsToRemove) {
        await removeTag(tag.id);
      }

      // Invalidate and refetch profile data
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      await refreshProfile(); // Update auth context for isProfileComplete check
      setIsEditing(false);
      setEditedProfile(null);
    } catch (error: any) {
      alert(`Failed to save profile: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(null);
    setIsEditing(false);
  };

  // Initialize editedProfile when entering edit mode
  const handleStartEditing = () => {
    if (profile) {
      setEditedProfile(profile);
      setIsEditing(true);
    }
  };

  // Handle clicking on a photo slot to upload
  const handlePhotoUpload = () => {
    // Check if we've reached max images
    const currentPhotos = apiProfile?.images.length || 0;
    if (currentPhotos >= MAX_IMAGES) {
      setImageError(
        `Maximum ${MAX_IMAGES} images allowed. Delete an image first.`,
      );
      return;
    }

    setImageError(null);
    fileInputRef.current?.click();
  };

  // Handle file selection from file picker
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Upload file
    uploadMutation.mutate(file);

    // Reset file input for future uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle photo deletion - pass the photo ID directly to avoid stale data issues
  const handlePhotoRemove = (photoId: number) => {
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    setImageError(null);
    deleteMutation.mutate(photoId);
  };

  // Handle setting a photo as profile picture - pass the photo ID directly
  const handleSetProfilePhoto = (photoId: number) => {
    setImageError(null);
    setProfileMutation.mutate(photoId);
  };

  const handleAddTag = (tag: string) => {
    if (!editedProfile) return;
    if (
      tag &&
      !editedProfile.tags.includes(tag) &&
      editedProfile.tags.length < 10
    ) {
      setEditedProfile({
        ...editedProfile,
        tags: [...editedProfile.tags, tag],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      tags: editedProfile.tags.filter((t) => t !== tag),
    });
  };

  const handleDetectLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    setLocationSuccess(null);

    // Check if geolocation is supported
    if (!isGeolocationSupported()) {
      setLocationError(
        "Geolocation is not supported by your browser. Please use IP-based detection.",
      );
      setLocationLoading(false);
      // Fall back to IP-based location
      handleIPLocationFallback();
      return;
    }

    try {
      // Try GPS first - this will request permission if needed
      const position = await requestGPSPermission();

      // Send GPS coordinates to API
      const response = await updateLocation({
        latitude: position.latitude,
        longitude: position.longitude,
      });

      // Update local state with success
      setLocationSuccess(
        `Location updated via GPS (${response.data.location.latitude.toFixed(4)}, ${response.data.location.longitude.toFixed(4)})`,
      );

      // Invalidate queries to refetch profile with new location
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      refreshProfile(); // Update auth context

      // Update edited profile if in edit mode
      if (editedProfile) {
        setEditedProfile({
          ...editedProfile,
          location: {
            ...editedProfile.location,
            lat: response.data.location.latitude,
            lng: response.data.location.longitude,
            isAutoDetected: true,
          },
          gpsEnabled: true,
        });
      }
    } catch (error: any) {
      // Check if it's a GeolocationPositionError (permission denied, etc.)
      if (error instanceof GeolocationPositionError) {
        const message = getGeolocationErrorMessage(error);
        setLocationError(message);

        // If permission denied, offer IP fallback
        if (error.code === error.PERMISSION_DENIED) {
          // Automatically try IP-based fallback
          handleIPLocationFallback();
        }
      } else {
        // API error or other error
        setLocationError(
          error?.data?.error ||
            error?.message ||
            "Failed to update location. Please try again.",
        );
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const handleIPLocationFallback = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      // Empty body = use IP geolocation
      const response = await updateLocation({});

      setLocationSuccess(
        `Location updated via IP (${response.data.location.latitude.toFixed(4)}, ${response.data.location.longitude.toFixed(4)})`,
      );

      // Invalidate queries to refetch profile
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      refreshProfile(); // Update auth context

      // Update edited profile if in edit mode
      if (editedProfile) {
        setEditedProfile({
          ...editedProfile,
          location: {
            ...editedProfile.location,
            lat: response.data.location.latitude,
            lng: response.data.location.longitude,
            isAutoDetected: false,
          },
          gpsEnabled: false,
        });
      }
    } catch (error: any) {
      setLocationError(
        error?.data?.error ||
          error?.message ||
          "Failed to detect location via IP. Please try again later.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

  const currentProfile = isEditing && editedProfile ? editedProfile : profile;

  // Photos always come from API data (not editedProfile) since they're saved immediately
  const photos = profile?.photos || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-20 md:pb-0">
        <Navbar activeTab="profile" />
        <main className="pt-4 pb-8 max-w-5xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-matcha" />
            <span className="ml-3 text-neutral-500">Loading profile...</span>
          </div>
        </main>
        <Footer />
        <MobileNav activeTab="profile" />
      </div>
    );
  }

  // Error state
  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-20 md:pb-0">
        <Navbar activeTab="profile" />
        <main className="pt-4 pb-8 max-w-5xl mx-auto px-4 lg:px-6">
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">
              {error instanceof Error
                ? error.message
                : "Failed to load profile"}
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNav activeTab="profile" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-20 md:pb-0">
      <Navbar activeTab="profile" />

      <main className="pt-4 pb-8 max-w-5xl mx-auto px-4 lg:px-6">
        {/* Profile Incomplete Warning Banner */}
        {!isProfileComplete && profileCompleteness && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 mb-1">
                  {incomplete
                    ? "Complete your profile to continue"
                    : "Your profile is incomplete"}
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  {incomplete
                    ? "You were redirected here because your profile is incomplete. Please fill in all required fields to start browsing and matching with others."
                    : "Complete your profile to unlock all features and start matching with others."}
                </p>
                <ProfileCompletenessIndicator
                  completeness={profileCompleteness}
                />
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              My Profile
            </h1>
            <p className="text-neutral-500 text-sm mt-1">
              Manage your profile and settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="h-10 px-4 text-sm font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 px-5 text-sm font-bold gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleStartEditing}
                variant={isProfileComplete ? "secondary" : "default"}
                className={`h-10 px-5 text-sm font-bold gap-2 ${isProfileComplete ? "border border-neutral-200" : ""}`}
              >
                <Edit3 className="w-4 h-4" />
                {isProfileComplete ? "Edit Profile" : "Complete Profile"}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos Section */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photos ({photos.filter((p) => p.url).length}/{MAX_IMAGES})
              </h2>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Error message */}
              {imageError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{imageError}</span>
                  <button
                    onClick={() => setImageError(null)}
                    className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Global upload indicator */}
              {uploadMutation.isPending && (
                <div className="mb-4 p-3 bg-matcha-light border border-matcha/30 rounded-xl flex items-center gap-3 text-sm text-matcha-dark">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading image...</span>
                </div>
              )}

              <div className="grid grid-cols-5 gap-3">
                {photos.map((photo, index) => {
                  const isDeleting =
                    deleteMutation.isPending &&
                    deleteMutation.variables === photo.id;
                  const isSettingProfile =
                    setProfileMutation.isPending &&
                    setProfileMutation.variables === photo.id;
                  const isProcessing = isDeleting || isSettingProfile;

                  return (
                    <div
                      key={index}
                      className={`
                        relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                        ${
                          photo.isProfilePic && photo.url
                            ? "ring-2 ring-matcha ring-offset-2 border-matcha"
                            : "border-neutral-200"
                        }
                        ${!photo.url ? "bg-neutral-100" : ""}
                      `}
                    >
                      {/* Loading overlay for delete/set-profile */}
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                        </div>
                      )}

                      {photo.url ? (
                        <>
                          <img
                            src={photo.url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {photo.isProfilePic && (
                            <div className="absolute top-1 left-1 bg-matcha text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              Profile
                            </div>
                          )}
                          {isEditing && !isProcessing && photo.id && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {!photo.isProfilePic && (
                                <button
                                  onClick={() =>
                                    handleSetProfilePhoto(photo.id!)
                                  }
                                  className="p-1.5 bg-white rounded-full hover:bg-matcha-light transition-colors"
                                  title="Set as profile photo"
                                >
                                  <Star className="w-3.5 h-3.5 text-neutral-700" />
                                </button>
                              )}
                              <button
                                onClick={() => handlePhotoRemove(photo.id!)}
                                className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors"
                                title="Remove photo"
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          )}
                        </>
                      ) : isEditing ? (
                        <button
                          onClick={handlePhotoUpload}
                          disabled={uploadMutation.isPending}
                          className="w-full h-full flex flex-col items-center justify-center text-neutral-400 hover:text-matcha hover:bg-matcha-light/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin text-matcha" />
                          ) : (
                            <>
                              <Plus className="w-5 h-5" />
                              <span className="text-[10px] mt-1">Add</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {isEditing && (
                <p className="text-xs text-neutral-400 mt-3">
                  Click the star to set as profile picture. Max 5MB per image
                  (JPG, PNG, GIF, WebP).
                </p>
              )}
            </section>

            {/* Personal Information */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                    First Name
                  </label>
                  {isEditing && editedProfile ? (
                    <input
                      type="text"
                      value={editedProfile.firstName}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-neutral-900">
                      {currentProfile?.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                    Last Name
                  </label>
                  {isEditing && editedProfile ? (
                    <input
                      type="text"
                      value={editedProfile.lastName}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-neutral-900">
                      {currentProfile?.lastName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                    Username
                  </label>
                  <p className="text-sm font-semibold text-neutral-900">
                    @{currentProfile?.username}
                  </p>
                  {isEditing && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Username cannot be changed
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-neutral-500 mb-1.5">
                    <Mail className="w-3 h-3" />
                    Email Address
                  </label>
                  {isEditing && editedProfile ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-neutral-900">
                      {currentProfile?.email}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Profile Details */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Profile Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                      Gender
                    </label>
                    {isEditing && editedProfile ? (
                      <select
                        value={editedProfile.gender}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            gender: e.target.value as MyProfile["gender"],
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha bg-white"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : (
                      <p className="text-sm font-semibold text-neutral-900">
                        {currentProfile?.gender || "Not specified"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                      Sexual Preferences
                    </label>
                    {isEditing && editedProfile ? (
                      <select
                        value={editedProfile.sexualPreferences}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            sexualPreferences: e.target
                              .value as MyProfile["sexualPreferences"],
                          })
                        }
                        className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha bg-white"
                      >
                        <option value="">Select preference</option>
                        <option value="Straight">Straight</option>
                        <option value="Gay">Gay</option>
                        <option value="Bisexual">Bisexual</option>
                      </select>
                    ) : (
                      <p className="text-sm font-semibold text-neutral-900">
                        {currentProfile?.sexualPreferences || "Not specified"}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1.5">
                    Biography
                  </label>
                  {isEditing && editedProfile ? (
                    <textarea
                      value={editedProfile.bio}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          bio: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha resize-none"
                      placeholder="Tell others about yourself..."
                    />
                  ) : (
                    <p className="text-sm text-neutral-700 whitespace-pre-line leading-relaxed">
                      {currentProfile?.bio || "No bio yet"}
                    </p>
                  )}
                </div>

                {/* Interest Tags */}
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">
                    Interest Tags ({currentProfile?.tags.length || 0}/10)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentProfile?.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="matcha"
                        className="px-2.5 py-1 text-xs flex items-center gap-1"
                      >
                        {tag}
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing &&
                    editedProfile &&
                    editedProfile.tags.length < 10 && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) =>
                              setNewTag(e.target.value.toLowerCase())
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag(newTag);
                              }
                            }}
                            placeholder="Add custom tag..."
                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-matcha/50 focus:border-matcha"
                          />
                          <Button
                            onClick={() => handleAddTag(newTag)}
                            disabled={!newTag}
                            className="px-4 h-10"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {AVAILABLE_TAGS.filter(
                            (t) => !editedProfile?.tags.includes(t),
                          )
                            .slice(0, 8)
                            .map((tag) => (
                              <button
                                key={tag}
                                onClick={() => handleAddTag(tag)}
                                className="px-2.5 py-1 text-xs bg-neutral-100 hover:bg-matcha-light text-neutral-600 hover:text-matcha-dark rounded-full transition-colors"
                              >
                                +{tag}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </section>

            {/* Location Section */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </h2>
              <div className="space-y-4">
                {/* Location Error Message */}
                {locationError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-sm text-amber-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p>{locationError}</p>
                    </div>
                    <button
                      onClick={() => setLocationError(null)}
                      className="p-1 hover:bg-amber-100 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Location Success Message */}
                {locationSuccess && (
                  <div className="p-3 bg-matcha-light border border-matcha/30 rounded-xl flex items-center gap-2 text-sm text-matcha-dark">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{locationSuccess}</span>
                    <button
                      onClick={() => setLocationSuccess(null)}
                      className="ml-auto p-1 hover:bg-matcha/20 rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Current Location Display */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentProfile?.gpsEnabled
                          ? "bg-matcha-light text-matcha"
                          : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {locationLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Navigation className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      {currentProfile?.location.lat &&
                      currentProfile?.location.lng ? (
                        <>
                          <p className="text-sm font-semibold text-neutral-900">
                            {currentProfile.location.lat.toFixed(4)},{" "}
                            {currentProfile.location.lng.toFixed(4)}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {currentProfile?.location.isAutoDetected
                              ? "Detected via GPS"
                              : "Detected via IP"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-neutral-900">
                            Location not set
                          </p>
                          <p className="text-xs text-neutral-500">
                            Click detect to set your location
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleDetectLocation}
                    disabled={locationLoading}
                    className="text-xs gap-1.5"
                  >
                    {locationLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        Detect GPS
                      </>
                    )}
                  </Button>
                </div>

                {/* IP Fallback Option */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-200 text-neutral-500">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">
                        Use approximate location
                      </p>
                      <p className="text-xs text-neutral-500">
                        Detect location via IP address (less accurate)
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleIPLocationFallback}
                    disabled={locationLoading}
                    className="text-xs gap-1.5"
                  >
                    {locationLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                    Use IP
                  </Button>
                </div>

                {/* Info about location usage */}
                <p className="text-xs text-neutral-500">
                  Your location helps match you with people nearby. GPS provides
                  the most accurate results. If GPS is unavailable or denied,
                  we'll use IP-based detection as a fallback.
                </p>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN - Stats & Lists */}
          <div className="space-y-6">
            {/* Fame Rating */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Fame Rating
              </h2>
              <div className="flex items-center gap-4">
                <div className="scale-125 origin-left">
                  <FameIndicator score={profile?.fameRating || 0} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {profile?.fameRating.toFixed(1) || "0.0"}
                  </p>
                  <p className="text-xs text-neutral-500">out of 100</p>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Your fame rating is based on profile views, likes, and matches.
              </p>
            </section>

            {/* Profile Visitors */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Recent Visitors ({visitors.length})
              </h2>
              {visitors.length > 0 ? (
                <div className="space-y-3">
                  {visitors.map((visitor) => (
                    <Link
                      key={visitor.id}
                      to="/profile/$userId"
                      params={{ userId: visitor.id }}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-matcha/20 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-matcha" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          @{visitor.username}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {visitor.visitedAt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-4">
                  No visitors yet
                </p>
              )}
            </section>

            {/* Likes */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Who Liked You ({likers.length})
              </h2>
              {likers.length > 0 ? (
                <div className="space-y-3">
                  {likers.map((liker) => (
                    <Link
                      key={liker.id}
                      to="/profile/$userId"
                      params={{ userId: liker.id }}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-coral/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-coral fill-coral" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          @{liker.username}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {liker.likedAt}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-4">
                  No likes yet
                </p>
              )}
            </section>

            {/* Account Actions */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
                Account
              </h2>
              <div className="space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav activeTab="profile" />
    </div>
  );
}
