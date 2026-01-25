import React from "react";
import { MapPin, Check, X, Eye, Heart } from "lucide-react";
import { User } from "@/types";
import { FameIndicator } from "./ui/fame-indicator";
import { Badge } from "./ui/badge";
import { Link } from "@tanstack/react-router";
import { getImageUrl } from "@/lib/utils";

// Generate avatar URL - uses user's first photo or falls back to DiceBear avatar
const getAvatarUrl = (user: User) => {
  if (user.photos?.length > 0 && user.photos[0]) {
    return getImageUrl(user.photos[0]) || getFallbackAvatar(user.id);
  }
  return getFallbackAvatar(user.id);
};

const getFallbackAvatar = (userId: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

export const ProfileCard = ({ user }: { user: User }) => {
  const avatarUrl = getAvatarUrl(user);

  return (
    <div
      className="
        relative
        w-full max-w-[340px] h-[480px]
        bg-white rounded-[20px] shadow-lg overflow-hidden
        cursor-pointer
      "
      style={{
        transition: "all 0.3s ease-out",
      }}
    >
      <Link to="/profile/$userId" params={{ userId: user.id }}>
        {/* Image Section */}
        <div className="h-[320px] relative">
          <img
            src={avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

          {/* Online Indicator */}
          <div
            className={`absolute top-4 right-4 w-3 h-3 rounded-full border-2 border-white ${
              user.isOnline ? "bg-matcha" : "bg-gray-500"
            }`}
          />

          {/* Fame Rating */}
          <div className="absolute top-4 left-4">
            <FameIndicator score={user.fameRating} />
          </div>

          {/* Overlay Info */}
          <div className="absolute bottom-0 left-0 w-full p-5 text-white">
            <div className="flex items-end gap-2 mb-1">
              <h3 className="text-2xl font-bold leading-none">
                {user.name.split(" ")[0]}
              </h3>
              <span className="text-lg opacity-90 font-normal">{user.age}</span>
              {user.verified && (
                <span className="mb-1">
                  <Check className="w-4 h-4 bg-blue-500 rounded-full p-0.5" />
                </span>
              )}
            </div>
            <div className="flex items-center text-sm opacity-90 mb-3">
              <MapPin className="w-4 h-4 mr-1" />
              {user.location} • {user.distance} km
            </div>
            <div className="flex flex-wrap gap-2">
              {user.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="neutral">
                  {tag}
                </Badge>
              ))}
              {user.tags.length > 3 && (
                <Badge variant="neutral">+{user.tags.length - 3}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Info Body */}
        <div className="p-5 h-[100px]">
          <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
            {user.bio}
          </p>
        </div>
      </Link>

      {/* Action Bar */}
      <div className="absolute bottom-0 w-full h-[60px] border-t border-gray-200 flex items-center justify-around bg-white">
        <button className="p-3 rounded-full text-gray-500 hover:bg-gray-50 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <button className="p-3 rounded-full text-gray-500 hover:bg-gray-50 transition-colors">
          <Eye className="w-6 h-6" />
        </button>
        <button className="p-3 rounded-full text-gray-500  hover:text-red-500 hover:bg-red-50 hover:scale-110 transition-all">
          <Heart className="w-7 h-7 hover:fill-current" />
        </button>
      </div>
    </div>
  );
};
