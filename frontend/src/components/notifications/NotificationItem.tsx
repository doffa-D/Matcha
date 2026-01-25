import { Heart, Eye, MessageCircle, HeartOff, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { Notification } from "@/context";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onClose: () => void;
}

const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "like":
      return <Heart className="w-4 h-4 text-coral fill-coral" />;
    case "visit":
      return <Eye className="w-4 h-4 text-blue-500" />;
    case "message":
      return <MessageCircle className="w-4 h-4 text-matcha" />;
    case "match":
      return <Sparkles className="w-4 h-4 text-amber-500" />;
    case "unlike":
      return <HeartOff className="w-4 h-4 text-neutral-400" />;
    default:
      return <Heart className="w-4 h-4 text-neutral-400" />;
  }
};

const getNotificationMessage = (notification: Notification): string => {
  const { type, from_user } = notification;
  const name = from_user.first_name || from_user.username;

  switch (type) {
    case "like":
      return `${name} liked your profile`;
    case "visit":
      return `${name} viewed your profile`;
    case "message":
      return `${name} sent you a message`;
    case "match":
      return `You matched with ${name}!`;
    case "unlike":
      return `${name} unliked your profile`;
    default:
      return `New notification from ${name}`;
  }
};

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  onClose,
}: NotificationItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Mark as read
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on type
    if (notification.type === "message") {
      navigate({ to: "/chat" });
    } else {
      navigate({ to: "/profile/$userId", params: { userId: String(notification.from_user.id) } });
    }

    onClose();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors hover:bg-neutral-50 ${
        !notification.is_read ? "bg-matcha/5" : ""
      }`}
    >
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-matcha to-matcha-dark flex items-center justify-center text-white font-semibold text-sm shrink-0">
        {notification.from_user.first_name?.charAt(0).toUpperCase() ||
          notification.from_user.username?.charAt(0).toUpperCase() ||
          "?"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="shrink-0">{getNotificationIcon(notification.type)}</span>
          <p className="text-sm text-neutral-800 truncate">
            {getNotificationMessage(notification)}
          </p>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">
          {getTimeAgo(notification.created_at)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="w-2.5 h-2.5 rounded-full bg-matcha shrink-0 mt-1.5" />
      )}
    </button>
  );
};






