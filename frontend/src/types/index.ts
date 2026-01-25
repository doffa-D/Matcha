export interface User {
  id: string;
  name: string;
  username: string;
  age: number;
  location: string;
  distance: number;
  bio: string;
  tags: string[];
  fameRating: number;
  photos: string[];
  isOnline: boolean;
  lastSeen?: string;
  verified?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatPreview {
  userId: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: "like" | "view" | "message" | "match" | "unlike";
  actorName: string;
  actorId: string;
  timestamp: string;
  isRead: boolean;
}

export interface FilterState {
  ageRange: [number, number] | null;
  distance: number | null;
  fameRange: [number, number] | null;
  tags: number[];
  sortBy: "distance" | "age" | "fame" | "tags";
}

// Default UI values for display (not sent to API unless changed)
export const FILTER_DEFAULTS = {
  ageRange: [18, 60] as [number, number],
  distance: 6500,
  fameRange: [0, 100] as [number, number],
};
