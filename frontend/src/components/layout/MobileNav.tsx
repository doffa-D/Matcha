import React, { useState } from "react";
import {
  Heart,
  Bell,
  User,
  ChevronDown,
  Settings,
  LogOut,
  MessageCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

interface MobileNavProps {
  activeTab: string;
}

export const MobileNav = ({ activeTab }: MobileNavProps) => {
  return (
    <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-neutral-200 h-16 flex items-center justify-around z-50 pb-safe">
      <Link to="/discover">
        <button
          // onClick={() => setActiveTab("discover")}
          className={`p-2 ${activeTab === "discover" ? "text-matcha" : "text-neutral-400"}`}
        >
          <Heart
            className={`w-6 h-6 ${activeTab === "discover" ? "fill-current" : ""}`}
          />
        </button>
      </Link>
      <button
        // onClick={() => setActiveTab("messages")}
        className={`p-2 relative ${activeTab === "messages" ? "text-matcha" : "text-neutral-400"}`}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-coral rounded-full" />
      </button>
      <button
        // onClick={() => setActiveTab("notifications")}
        className={`p-2 ${activeTab === "notifications" ? "text-matcha" : "text-neutral-400"}`}
      >
        <Bell className="w-6 h-6" />
      </button>
      <button
        // onClick={() => setActiveTab("profile")}
        className={`p-2 ${activeTab === "profile" ? "text-matcha" : "text-neutral-400"}`}
      >
        <User className="w-6 h-6" />
      </button>
    </div>
  );
};
