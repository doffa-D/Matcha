import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";
import { useNotifications } from "@/context";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/api";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown = ({
  isOpen,
  onClose,
}: NotificationDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const {
    notifications: localNotifications,
    setNotifications,
    setUnreadCount,
    markAsRead: localMarkAsRead,
    markAllAsRead: localMarkAllAsRead,
  } = useNotifications();

  // Fetch notifications from API
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await getNotifications();
      return response.data;
    },
    enabled: isOpen, // Only fetch when dropdown is open
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await getUnreadCount();
      return response.data;
    },
    staleTime: 10000, // Refresh every 10 seconds
    refetchInterval: 10000, // Auto-refresh
  });

  // Sync API data with local state
  useEffect(() => {
    if (data?.notifications) {
      setNotifications(data.notifications);
    }
  }, [data, setNotifications]);

  useEffect(() => {
    if (unreadData?.unread_count !== undefined) {
      setUnreadCount(unreadData.unread_count);
    }
  }, [unreadData, setUnreadCount]);

  // Mark single notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_, id) => {
      localMarkAsRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      localMarkAllAsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid immediate close from the bell click
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const hasUnread = localNotifications.some((n) => !n.is_read);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-card-hover border border-neutral-100 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="text-xs font-medium text-matcha hover:text-matcha-dark transition-colors disabled:opacity-50"
          >
            {markAllAsReadMutation.isPending ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-matcha animate-spin" />
          </div>
        ) : localNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500 text-center">
              No notifications yet
            </p>
            <p className="text-xs text-neutral-400 text-center mt-1">
              When someone likes or visits your profile, you'll see it here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {localNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};






