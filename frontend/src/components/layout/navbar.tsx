import { useState, useRef, useEffect, useMemo } from "react";
import { Bell, User, ChevronDown, Settings, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth, useNotifications } from "@/context";
import { getUnreadCount, getConversations } from "@/api";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { getImageUrl } from "@/lib/utils";

interface NavbarProps {
  activeTab: string;
}

export const Navbar = ({ activeTab }: NavbarProps) => {
  const { logout, user, profile } = useAuth();

  // Get user's profile image
  const profileImage = useMemo(() => {
    if (!profile?.images?.length) {
      // Fallback avatar
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "default"}`;
    }
    // Find profile pic or use first image
    const profilePic = profile.images.find((img) => img.is_profile_pic) || profile.images[0];
    return getImageUrl(profilePic.file_path) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`;
  }, [profile?.images, user?.id]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const { unreadCount, setUnreadCount } = useNotifications();

  // Fetch unread count on mount and periodically
  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await getUnreadCount();
      return response.data;
    },
    staleTime: 10000,
    refetchInterval: 10000,
  });

  // Sync unread count with socket context
  useEffect(() => {
    if (unreadData?.unread_count !== undefined) {
      setUnreadCount(unreadData.unread_count);
    }
  }, [unreadData, setUnreadCount]);

  // Fetch conversations for chat unread count
  const { data: conversationsData } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: async () => {
      const response = await getConversations();
      return response.data;
    },
    staleTime: 10000,
    refetchInterval: 10000,
  });

  // Calculate total unread messages from all conversations
  const totalUnreadMessages = useMemo(() => {
    if (!conversationsData?.conversations) return 0;
    return conversationsData.conversations.reduce(
      (total, conv) => total + conv.unread_count,
      0
    );
  }, [conversationsData]);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  const navLinkClass = (tab: string) => `
    relative px-1 py-6 text-[15px] font-medium transition-colors cursor-pointer
    ${activeTab === tab ? "text-matcha" : "text-neutral-700 hover:text-matcha"}
  `;

  const activeIndicator = (tab: string) =>
    activeTab === tab && (
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-matcha rounded-t-sm" />
    );

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-nav h-[72px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/discover"
          className="flex items-center gap-0.5 cursor-pointer"
        >
          <img src="/logo.svg" alt="Logo" className="h-8 sm:h-8 " />

          <span className="text-2xl font-bold text-neutral-900 tracking-tight">
            Matcha
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8 h-full">
          <Link to="/" className={navLinkClass("home")}>
            Home
            {activeIndicator("home")}
          </Link>
          <Link to="/discover" className={navLinkClass("discover")}>
            Discover
            {activeIndicator("discover")}
          </Link>
          <Link to="/chat" className={navLinkClass("messages")}>
            <div className="relative inline-block">
              Messages
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-2 -right-3 bg-coral text-white text-[9px] font-bold px-[4.5px] py-[1.2px] rounded-full">
                  {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                </span>
              )}
            </div>

            {activeIndicator("messages")}
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-6">
          {/* Notifications */}
          <div className="relative">
            <button
              ref={notificationButtonRef}
              className="relative text-neutral-700 hover:text-neutral-900 transition-colors"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-coral text-white text-[10px] font-bold px-1 flex items-center justify-center rounded-full border-2 border-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <NotificationDropdown
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
            />
          </div>

          <div className="relative">
            <button
              className="flex items-center gap-2 focus:outline-none"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <img
                src={profileImage}
                alt="My Profile"
                className="w-10 h-10 rounded-full border-2 border-neutral-200 object-cover"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-neutral-900">
                  {user?.username ?? "User"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-card-hover py-2 border border-neutral-100">
                <div className="px-4 py-3 border-b border-neutral-100">
                  <p className="text-sm font-bold text-neutral-900">
                    Signed in as @{user?.username}
                  </p>
                </div>
                <Link
                  to="/me"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
                >
                  <User className="w-4 h-4" /> My Profile
                </Link>
                <button className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <div className="border-t border-neutral-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-coral hover:bg-coral-light/20 flex items-center gap-3"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
