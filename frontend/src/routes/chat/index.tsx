import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle, MoreHorizontal, Search, Send } from "lucide-react";

import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/navbar";
import { ProtectedRoute } from "@/components/protected-route";
import Button from "@/components/ui/button";
import { getConversations, getMessages, sendMessage, markMessagesAsRead } from "@/api";
import type { Conversation, ChatMessage } from "@/api/types";
import { getImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/chat/")({
  component: () => (
    <ProtectedRoute>
      <Chat />
    </ProtectedRoute>
  ),
});

function Chat() {
  const activeTab = "messages";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-matcha/20 selection:text-matcha-dark">
      <Navbar activeTab={activeTab} />
      <main className="top-20">
        <MessagesPage />
      </main>
      <MobileNav activeTab={activeTab} />
    </div>
  );
}

// Helper to format message timestamp
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Helper to format conversation timestamp (shorter)
function formatConversationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Group messages by date
function groupMessagesByDate(messages: ChatMessage[]): { date: string; messages: ChatMessage[] }[] {
  const groups: { [key: string]: ChatMessage[] } = {};
  
  messages.forEach((msg) => {
    const date = new Date(msg.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateKey: string;
    if (date.toDateString() === today.toDateString()) {
      dateKey = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = "Yesterday";
    } else {
      dateKey = date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
    }
    
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
  });

  return Object.entries(groups).map(([date, msgs]) => ({ date, messages: msgs }));
}

function MessagesPage() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: async () => {
      const response = await getConversations();
      return response.data;
    },
    refetchInterval: 10000, // Poll every 10s as backup to WebSocket
  });

  const conversations = conversationsData?.conversations || [];

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.user.username.toLowerCase().includes(searchLower) ||
      conv.user.first_name.toLowerCase().includes(searchLower) ||
      conv.user.last_name.toLowerCase().includes(searchLower)
    );
  });

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedUserId && conversations.length > 0) {
      setSelectedUserId(conversations[0].user.id);
    }
  }, [conversations, selectedUserId]);

  // Get selected conversation data
  const selectedConversation = conversations.find((c) => c.user.id === selectedUserId);

  // Fetch messages for selected user
  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ["chat", "messages", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return { messages: [], has_more: false };
      const response = await getMessages(selectedUserId);
      return response.data;
    },
    enabled: !!selectedUserId,
    refetchInterval: 5000, // Poll every 5s as backup to WebSocket
  });

  const messages = messagesData?.messages || [];

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedUserId && selectedConversation?.unread_count && selectedConversation.unread_count > 0) {
      markMessagesAsRead(selectedUserId).then(() => {
        // Invalidate conversations to update unread counts
        queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      });
    }
  }, [selectedUserId, selectedConversation?.unread_count, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ userId, content }: { userId: number; content: string }) => {
      const response = await sendMessage(userId, content);
      return response.data;
    },
    onSuccess: () => {
      setMessageInput("");
      // Invalidate queries to show new message
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
    onError: (error: any) => {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    },
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedUserId || sendMutation.isPending) return;
    sendMutation.mutate({ userId: selectedUserId, content: messageInput.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get current user ID from localStorage
  const getCurrentUserId = (): number | null => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.id;
      }
    } catch {}
    return null;
  };

  const currentUserId = getCurrentUserId();

  // Group messages by date for display
  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="max-w-[90rem] mx-auto h-[calc(100vh-72px)]">
      <div className="bg-white shadow-card h-full flex overflow-hidden border border-neutral-700/5 rounded-2xl">
        {/* Conversations List */}
        <div className="w-[320px] border-r border-neutral-700/5 flex flex-col bg-white">
          <div className="p-5 border-b border-neutral-700/5">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Messages</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-neutral-50 border border-neutral-700/5 rounded-lg text-sm focus:outline-none focus:border-matcha focus:ring-1 focus:ring-matcha"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-matcha" />
              </div>
            ) : conversationsError ? (
              <div className="text-center py-12 text-neutral-500">
                <p>Failed to load conversations</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </p>
                {!searchQuery && (
                  <p className="text-neutral-400 text-xs mt-1">
                    Match with someone to start chatting!
                  </p>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.user.id}
                  conversation={conv}
                  isSelected={selectedUserId === conv.user.id}
                  onClick={() => setSelectedUserId(conv.user.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedUserId && selectedConversation ? (
          <div className="flex-1 flex flex-col bg-neutral-50">
            {/* Header */}
            <div className="h-[72px] px-6 border-b border-neutral-700/5 bg-white flex items-center justify-between">
              <Link
                to="/profile/$userId"
                params={{ userId: String(selectedUserId) }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="relative">
                  <img
                    src={getImageUrl(selectedConversation.user.profile_image) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserId}`}
                    className="w-10 h-10 rounded-full object-cover"
                    alt={selectedConversation.user.username}
                  />
                  {selectedConversation.user.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-matcha rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900">
                    {selectedConversation.user.first_name} {selectedConversation.user.last_name}
                  </h3>
                  <p className={`text-xs font-medium ${selectedConversation.user.is_online ? "text-matcha" : "text-neutral-400"}`}>
                    {selectedConversation.user.is_online ? "Online now" : "Offline"}
                  </p>
                </div>
              </Link>
              <button className="p-2 text-neutral-500 hover:bg-neutral-50 rounded-full">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-matcha" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-16 h-16 text-neutral-200 mb-4" />
                  <p className="text-neutral-500">No messages yet</p>
                  <p className="text-neutral-400 text-sm mt-1">
                    Say hello to start the conversation!
                  </p>
                </div>
              ) : (
                messageGroups.map((group) => (
                  <div key={group.date}>
                    {/* Date Divider */}
                    <div className="flex justify-center mb-4">
                      <span className="bg-neutral-200 text-neutral-600 text-xs px-3 py-1 rounded-full">
                        {group.date}
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="space-y-4">
                      {group.messages.map((msg) => {
                        const isMine = msg.sender_id === currentUserId;
                        return (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            isMine={isMine}
                            userImage={
                              !isMine
                                ? getImageUrl(selectedConversation.user.profile_image) ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserId}`
                                : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-neutral-700/5">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMutation.isPending}
                  className="flex-1 h-12 bg-neutral-50 border border-neutral-700/5 rounded-xl px-4 focus:outline-none focus:border-matcha focus:ring-1 focus:ring-matcha disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMutation.isPending}
                  className="w-12 h-12 rounded-xl bg-matcha hover:bg-matcha/90 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // No conversation selected
          <div className="flex-1 flex flex-col items-center justify-center bg-neutral-50">
            <MessageCircle className="w-20 h-20 text-neutral-200 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">
              {conversations.length === 0 ? "No matches yet" : "Select a conversation"}
            </h3>
            <p className="text-neutral-400 text-center max-w-xs">
              {conversations.length === 0
                ? "When you match with someone, you can chat with them here!"
                : "Choose a conversation from the list to start chatting"}
            </p>
            {conversations.length === 0 && (
              <Link to="/discover">
                <Button className="mt-4">Discover People</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Conversation list item component
function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { user, last_message, unread_count } = conversation;
  const imageUrl = getImageUrl(user.profile_image) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

  return (
    <div
      onClick={onClick}
      className={`p-4 flex gap-3 cursor-pointer transition-colors ${
        isSelected
          ? "bg-matcha-light/30 border-l-4 border-matcha"
          : "hover:bg-neutral-50 border-l-4 border-transparent"
      }`}
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover"
        />
        {user.is_online && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-matcha rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-semibold text-neutral-900 truncate">
            {user.first_name} {user.last_name}
          </h3>
          {last_message && (
            <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
              {formatConversationTime(last_message.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p
            className={`text-sm truncate flex-1 ${
              unread_count > 0 ? "text-neutral-900 font-semibold" : "text-neutral-500"
            }`}
          >
            {last_message ? (
              <>
                {last_message.is_mine && "You: "}
                {last_message.content}
              </>
            ) : (
              <span className="italic text-neutral-400">No messages yet</span>
            )}
          </p>
          {unread_count > 0 && (
            <span className="bg-matcha text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
              {unread_count > 99 ? "99+" : unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Message bubble component
function MessageBubble({
  message,
  isMine,
  userImage,
}: {
  message: ChatMessage;
  isMine: boolean;
  userImage?: string;
}) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isMine) {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[60%]">
          <div className="bg-matcha text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-sm">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
          <span className="text-xs text-neutral-400 mr-2 mt-1 block text-right">
            {time}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {userImage && (
        <img
          src={userImage}
          className="w-8 h-8 rounded-full self-end mb-5"
          alt="User"
        />
      )}
      <div className="max-w-[60%]">
        <div className="bg-white border border-neutral-100 text-neutral-900 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <span className="text-xs text-neutral-400 ml-2 mt-1 block">{time}</span>
      </div>
    </div>
  );
}
