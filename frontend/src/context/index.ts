export {
  AuthProvider,
  useAuth,
  useIsAuthenticated,
  useCurrentUser,
  checkProfileCompleteness,
} from "./auth-context";

export type { ProfileCompleteness } from "./auth-context";

export {
  SocketProvider,
  useSocket,
  useSocketConnection,
  useNotifications,
} from "./socket-context";

export type { Notification } from "./socket-context";