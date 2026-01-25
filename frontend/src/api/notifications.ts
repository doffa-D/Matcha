/**
 * Notifications API
 * Handles fetching and updating notification status
 */

import api from "@/lib/api";
import type {
  NotificationsResponse,
  UnreadCountResponse,
  MessageResponse,
} from "./types";

/**
 * Get list of notifications (max 50)
 */
export const getNotifications = () =>
  api.get<NotificationsResponse>("/notifications");

/**
 * Get unread notification count
 */
export const getUnreadCount = () =>
  api.get<UnreadCountResponse>("/notifications/unread/count");

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = (id: number) =>
  api.put<MessageResponse>(`/notifications/${id}/read`);

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = () =>
  api.put<MessageResponse>("/notifications/read-all");
