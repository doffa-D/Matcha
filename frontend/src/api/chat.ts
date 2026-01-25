/**
 * Chat API
 * Handles fetching conversations and messages
 */

import api from "@/lib/api";
import type {
  ConversationsResponse,
  MessagesResponse,
  SendMessageResponse,
  MessageResponse,
} from "./types";

/**
 * Get list of all conversations (connected users)
 */
export const getConversations = () =>
  api.get<ConversationsResponse>("/chat/conversations");

/**
 * Get messages with a specific user
 */
export const getMessages = (userId: number, limit = 50, beforeId?: number) => {
  let url = `/chat/messages/${userId}?limit=${limit}`;
  if (beforeId) url += `&before_id=${beforeId}`;
  return api.get<MessagesResponse>(url);
};

/**
 * Send a message to a user
 */
export const sendMessage = (userId: number, content: string) =>
  api.post<SendMessageResponse>(`/chat/messages/${userId}`, { content });

/**
 * Mark all messages from a user as read
 */
export const markMessagesAsRead = (userId: number) =>
  api.put<MessageResponse>(`/chat/messages/${userId}/read`);
