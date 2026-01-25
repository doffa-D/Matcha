import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Flag,
  Ban,
  MapPin,
  Calendar,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Navbar } from "@/components/layout/navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import Button from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FameIndicator } from "@/components/ui/fame-indicator";
import { getUserProfile, toggleLike, blockUser, reportUser } from "@/api/users";
import { getImageUrl } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import type { UserProfile as ApiUserProfile } from "@/api/types";

export const Route = createFileRoute("/profile/$userId/")({
  component: ProfilePage,
});

// --- Types ---
interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: "Male" | "Female" | "Non-binary" | "Other";
  sexualPreferences: "Heterosexual" | "Bisexual" | "Homosexual" | "Other";
  bio: string;
  tags: string[];
  photos: string[];
  fameRating: number;
  location: string;
  distance: number;
  isOnline: boolean;
  lastSeen?: string;
  verified: boolean;
  connectionStatus: "none" | "liked" | "matched";
  likedYou: boolean;
}

// --- Helper Functions ---
// Generate a fallback avatar URL based on user id
const getAvatarUrl = (userId: string) => {
  // Use DiceBear API for random avatars
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
};

// Format last seen timestamp to human-readable format
const formatLastSeen = (lastSeen?: string): string => {
  if (!lastSeen) return "Offline";
  
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return "Last seen just now";
  } else if (diffMinutes < 60) {
    return `Last seen ${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `Last seen ${diffHours}h ago`;
  } else if (diffDays === 1) {
    return "Last seen yesterday";
  } else if (diffDays < 7) {
    return `Last seen ${diffDays}d ago`;
  } else {
    // Format as date for older timestamps
    return `Last seen ${lastSeenDate.toLocaleDateString()}`;
  }
};

const transformApiProfile = (apiProfile: ApiUserProfile): UserProfile => {
  // Get all image URLs with proper base URL, or use fallback avatar if no images
  const photos =
    apiProfile.images.length > 0
      ? apiProfile.images.map((img) => getImageUrl(img.file_path) || "")
      : [getAvatarUrl(String(apiProfile.id))];

  // Determine connection status
  let connectionStatus: UserProfile["connectionStatus"] = "none";
  if (apiProfile.connected) {
    connectionStatus = "matched";
  } else if (apiProfile.liked_by_me) {
    connectionStatus = "liked";
  }

  return {
    id: String(apiProfile.id),
    username: apiProfile.username,
    firstName: apiProfile.first_name,
    lastName: apiProfile.last_name,
    age: apiProfile.age || 0,
    gender: (apiProfile.gender as UserProfile["gender"]) || "Other",
    sexualPreferences:
      (apiProfile.sexual_preference as UserProfile["sexualPreferences"]) ||
      "Other",
    bio: apiProfile.bio || "",
    tags: apiProfile.tags.map((t) => t.tag_name),
    photos,
    fameRating: apiProfile.fame_rating * 20, // Convert 0-5 to 0-100
    location: "Unknown", // API doesn't return location name
    distance: 0, // API doesn't return distance in profile view
    isOnline: apiProfile.is_online || false,
    lastSeen: apiProfile.last_online || undefined,
    verified: apiProfile.is_verified,
    connectionStatus,
    likedYou: apiProfile.liked_by_them,
  };
};

function ProfilePage() {
  const { userId } = Route.useParams();
  const queryClient = useQueryClient();
  const { profileCompleteness } = useAuth();
  const [activePhoto, setActivePhoto] = useState<string>("");

  // Fetch user profile
  const {
    data: apiProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const response = await getUserProfile(Number(userId));
      return response.data;
    },
    retry: false, // Don't retry on error (e.g., user not found)
  });

  // Transform API data
  const user = apiProfile ? transformApiProfile(apiProfile) : null;

  // Set initial active photo when profile loads
  if (user && !activePhoto && user.photos.length > 0) {
    setActivePhoto(user.photos[0]);
  }

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async (shouldLike: boolean) => {
      const response = await toggleLike(Number(userId), shouldLike);
      return response.data;
    },
    onSuccess: () => {
      // Refetch profile to get updated connection status
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    },
    onError: (error: any) => {
      alert(`Failed to update like: ${error.message || "Unknown error"}`);
    },
  });

  // Block mutation
  const blockMutation = useMutation({
    mutationFn: async () => {
      const response = await blockUser(Number(userId));
      return response.data;
    },
    onSuccess: () => {
      alert("User blocked successfully.");
      // Optionally navigate away or update UI
    },
    onError: (error: any) => {
      alert(`Failed to block user: ${error.message || "Unknown error"}`);
    },
  });

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: async () => {
      const response = await reportUser(Number(userId));
      return response.data;
    },
    onSuccess: () => {
      alert("User reported successfully.");
    },
    onError: (error: any) => {
      alert(`Failed to report user: ${error.message || "Unknown error"}`);
    },
  });

  const handleLike = () => {
    if (!user) return;

    // Check if current user has a profile picture
    if (!profileCompleteness.hasImage) {
      alert("You must upload a profile picture before liking other users.");
      return;
    }

    if (user.connectionStatus === "none") {
      likeMutation.mutate(true);
    } else {
      likeMutation.mutate(false);
    }
  };

  const handleBlock = () => {
    if (
      window.confirm("Are you sure? They will be hidden and chat disabled.")
    ) {
      blockMutation.mutate();
    }
  };

  const handleReport = () => {
    if (window.confirm("Report this user as a fake account?")) {
      reportMutation.mutate();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-16 md:pb-0">
        <Navbar activeTab="profile" />
        <main className="pt-4 pb-4 max-w-7xl mx-auto px-4 lg:px-6">
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
  if (isError || !user) {
    // Extract error message from API response
    const errorMessage =
      (error as any)?.data?.error ||
      (error instanceof Error ? error.message : "Failed to load profile");
    const isNotFound = errorMessage.toLowerCase().includes("not found");

    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-16 md:pb-0">
        <Navbar activeTab="profile" />
        <main className="pt-4 pb-4 max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center py-20">
            <div className="mb-6">
              {isNotFound ? (
                <>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    User Not Found
                  </h2>
                  <p className="text-neutral-500">
                    This user doesn't exist or has been removed.
                  </p>
                </>
              ) : (
                <p className="text-red-500">{errorMessage}</p>
              )}
            </div>
            <Link to="/discover">
              <Button variant="secondary">Back to Discover</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileNav activeTab="profile" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-16 md:pb-0">
      <Navbar activeTab="profile" />

      {/* Responsive container with adjusted padding */}
      <main className="pt-4 pb-4 max-w-7xl mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* LEFT COL: Photos */}
          <div className="lg:col-span-6 space-y-3 flex flex-col">
            {/* Main Photo - Responsive aspect ratio */}
            <div className="relative aspect-square sm:aspect-[1.1] w-full overflow-hidden rounded-2xl shadow-lg bg-gray-200 group">
              <img
                src={activePhoto || getAvatarUrl(user.id)}
                alt={user.username}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Online Badge overlay - Responsive sizing */}
              <div className="absolute top-3 right-3 sm:top-6 sm:right-6 bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-sm border border-white/20">
                <div
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${user.isOnline ? "bg-matcha shadow-[0_0_8px_rgba(143,206,0,0.6)]" : "bg-gray-400"}`}
                />
                <span className="text-xs sm:text-sm font-bold text-neutral-700">
                  {user.isOnline ? "Online" : formatLastSeen(user.lastSeen)}
                </span>
              </div>
            </div>

            {/* Thumbnails - Responsive grid */}
            {user.photos.length > 1 && (
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {user.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePhoto(photo)}
                    className={`
                    aspect-square rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                    ${
                      activePhoto === photo
                        ? "ring-2 sm:ring-4 ring-neutral-900 ring-offset-1 sm:ring-offset-2 scale-100"
                        : "opacity-70 hover:opacity-100 hover:scale-[1.04]"
                    }
                  `}
                  >
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COL: Info & Actions */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-neutral-100 flex-1 flex flex-col">
              {/* Header Info */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-1.5 sm:gap-2 text-neutral-900 tracking-tight">
                    <span className="truncate">
                      {user.firstName} {user.lastName}
                    </span>
                    {user.verified && (
                      <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-blue-500 fill-blue-50 shrink-0" />
                    )}
                  </h1>

                  {/* Username row - Responsive */}
                  <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 flex-wrap">
                    <p className="text-neutral-400 text-base sm:text-xl font-medium truncate">
                      @{user.username}
                    </p>

                    {user.connectionStatus === "matched" && (
                      <span className="flex items-center gap-1 sm:gap-1.5 text-matcha font-bold text-xs sm:text-sm bg-gray-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl border border-gray-100">
                        <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-matcha" />
                        Matched
                      </span>
                    )}

                    {user.connectionStatus === "none" && user.likedYou && (
                      <span className="flex items-center gap-1 sm:gap-1.5 text-amber-900 font-bold text-xs sm:text-sm bg-gray-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl sm:rounded-2xl border border-gray-100">
                        <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Likes You
                      </span>
                    )}
                  </div>
                </div>

                <div className="scale-90 sm:scale-110 origin-top-right shrink-0 ml-2">
                  <FameIndicator score={Math.round(user.fameRating)} />
                </div>
              </div>

              {/* Basic Stats - Responsive */}
              <div className="flex flex-wrap gap-2 mb-4 text-xs font-medium text-neutral-600">
                <span className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />{" "}
                  {user.age} years old
                </span>
                <span className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />{" "}
                  <span className="truncate max-w-[200px]">
                    {user.location}
                  </span>{" "}
                  <span className="text-neutral-400">|</span> {user.distance}km
                </span>
              </div>

              <div className="space-y-4 flex-1">
                {/* About Section */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                    About
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                    <div>
                      <span className="text-neutral-400 block text-xs mb-1">
                        Gender
                      </span>
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base">
                        {user.gender}
                      </p>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-xs mb-1">
                        Orientation
                      </span>
                      <p className="font-semibold text-neutral-900 text-sm sm:text-base">
                        {user.sexualPreferences}
                      </p>
                    </div>
                  </div>
                  <p className="text-neutral-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {user.bio}
                  </p>
                </div>

                {/* Tags */}
                {user.tags.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                      Interests
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {user.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="matcha"
                          className="px-2 py-0.5 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Spacer pushes actions to bottom */}
              <div className="my-4" />

              {/* --- ACTION AREA --- */}
              <div className="space-y-3">
                {/* Main Actions: Like & Chat */}
                <div className="grid grid-cols-2 gap-3">
                  {/* LIKE BUTTON */}
                  <Button
                    onClick={handleLike}
                    disabled={
                      likeMutation.isPending || !profileCompleteness.hasImage
                    }
                    title={
                      !profileCompleteness.hasImage
                        ? "Upload a profile picture first"
                        : ""
                    }
                    className={`h-10 text-sm font-bold gap-2 rounded-xl shadow-sm transition-all active:scale-95 ${!profileCompleteness.hasImage ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {likeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart
                        className={`w-4 h-4 ${user.connectionStatus !== "none" ? "fill-current" : ""}`}
                      />
                    )}
                    {user.connectionStatus !== "none" ? "Liked" : "Like"}
                  </Button>

                  {/* CHAT BUTTON */}
                  <Link to="/chat" className="w-full">
                    <Button
                      disabled={user.connectionStatus !== "matched"}
                      variant={
                        user.connectionStatus === "matched"
                          ? "ghost"
                          : "secondary"
                      }
                      className="h-10 text-sm font-bold gap-2 rounded-xl w-full bg-white p-3 shadow-xs border-neutral-200/50 border-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </Button>
                  </Link>
                </div>

                {/* Profile picture required message */}
                {!profileCompleteness.hasImage && (
                  <p className="text-xs text-amber-600 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Upload a profile picture to like users
                  </p>
                )}

                {/* Safety Actions */}
                <div className="flex justify-center gap-6 pt-2 border-t border-neutral-100 mt-3">
                  <button
                    onClick={handleReport}
                    disabled={reportMutation.isPending}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-neutral-400 hover:text-orange-500 transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {reportMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}{" "}
                    Report
                  </button>
                  <button
                    onClick={handleBlock}
                    disabled={blockMutation.isPending}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-neutral-400 hover:text-red-600 transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {blockMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}{" "}
                    Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav activeTab="profile" />
    </div>
  );
}
