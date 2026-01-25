import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

// =============================================================================
// TYPES
// =============================================================================

export interface Notification {
  id: number;
  type: "like" | "visit" | "message" | "match" | "unlike";
  from_user: {
    id: number;
    username: string;
    first_name: string;
  };
  is_read: boolean;
  created_at: string;
}

interface NewMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const SocketContext = createContext<SocketContextValue | null>(null);

// =============================================================================
// STORAGE HELPERS
// =============================================================================

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";

// =============================================================================
// PROVIDER
// =============================================================================

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      // No token, don't connect
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection handlers
    newSocket.on("connect", () => {
      console.log("[Socket] Connected:", newSocket.id);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
      setIsConnected(false);
    });

    // Listen for notifications
    newSocket.on("notification", (data: Notification) => {
      console.log("[Socket] Notification received:", data);
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Invalidate notifications query to keep in sync
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    // Listen for new messages
    newSocket.on("new_message", (data: NewMessage) => {
      console.log("[Socket] New message received:", data);
      // Invalidate messages query to update chat
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    // Cleanup on unmount
    return () => {
      console.log("[Socket] Cleaning up connection");
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty deps - we handle token changes via auth context integration

  // Add notification to the list
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Disconnect socket (called on logout)
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // Listen for logout events from auth context
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" && !e.newValue) {
        // Token was removed (logout), disconnect socket
        disconnectSocket();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [disconnectSocket]);

  const value: SocketContextValue = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setNotifications,
    setUnreadCount,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access socket context
 * @throws Error if used outside SocketProvider
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

/**
 * Hook for components that only need connection status
 */
export function useSocketConnection() {
  const { isConnected, socket } = useSocket();
  return { isConnected, socket };
}

/**
 * Hook for notification-related functionality
 */
export function useNotifications() {
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setNotifications,
    setUnreadCount,
  } = useSocket();

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    setNotifications,
    setUnreadCount,
  };
}





