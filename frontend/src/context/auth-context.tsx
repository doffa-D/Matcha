import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { login as apiLogin, logout as apiLogout } from "@/api/auth";
import { getMyProfile } from "@/api/profile";
import type { MyProfile, LoginRequest, LoginResponse } from "@/api/types";

// =============================================================================
// TYPES
// =============================================================================

interface AuthUser {
  id: number;
  username: string;
  email: string;
}

/**
 * Fields required to consider a profile complete
 */
export interface ProfileCompleteness {
  hasGender: boolean;
  hasSexualPreference: boolean;
  hasBio: boolean;
  hasTag: boolean;
  hasImage: boolean;
  isComplete: boolean;
}

/**
 * Check if a profile has all required fields filled
 */
export function checkProfileCompleteness(
  profile: MyProfile | null,
): ProfileCompleteness {
  if (!profile) {
    return {
      hasGender: false,
      hasSexualPreference: false,
      hasBio: false,
      hasTag: false,
      hasImage: false,
      isComplete: false,
    };
  }

  const hasGender = !!profile.gender;
  const hasSexualPreference = !!profile.sexual_preference;
  const hasBio = !!profile.bio?.trim();
  const hasTag = profile.tags.length >= 1;
  const hasImage = profile.images.length >= 1;

  return {
    hasGender,
    hasSexualPreference,
    hasBio,
    hasTag,
    hasImage,
    isComplete:
      hasGender && hasSexualPreference && hasBio && hasTag && hasImage,
  };
}

interface AuthState {
  user: AuthUser | null;
  profile: MyProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  isProfileComplete: boolean;
  profileCompleteness: ProfileCompleteness;
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// =============================================================================
// STORAGE HELPERS
// =============================================================================

const TOKEN_KEY = "token";
const USER_KEY = "user";

const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: (): AuthUser | null => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },
  setUser: (user: AuthUser) =>
    localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// =============================================================================
// PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = storage.getToken();
      const storedUser = storage.getUser();

      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Token exists, try to validate by fetching profile
      try {
        const { data: profile } = await getMyProfile();
        setState({
          user: storedUser || {
            id: profile.id,
            username: profile.username,
            email: profile.email,
          },
          profile,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        // Token is invalid or expired
        console.error("Auth initialization failed:", error);
        storage.clear();
        setState({
          user: null,
          profile: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    const { data } = await apiLogin(credentials);

    // Store token and user
    storage.setToken(data.token);
    storage.setUser(data.user);

    // Fetch profile immediately after login to check completeness
    const { data: profile } = await getMyProfile();

    // Update state with user and profile
    setState({
      user: data.user,
      profile,
      token: data.token,
      isAuthenticated: true,
      isLoading: false,
    });

    return data;
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout API to invalidate token on server
      await apiLogout();
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error("Logout API error:", error);
    } finally {
      // Clear local storage and state
      storage.clear();
      setState({
        user: null,
        profile: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Navigate to login page
      navigate({ to: "/login" });
    }
  }, [navigate]);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!state.token) return;

    try {
      const { data: profile } = await getMyProfile();
      setState((prev) => ({
        ...prev,
        profile,
        user: prev.user || {
          id: profile.id,
          username: profile.username,
          email: profile.email,
        },
      }));
    } catch (error) {
      console.error("Failed to refresh profile:", error);
      throw error;
    }
  }, [state.token]);

  // Manual user setter (for external updates)
  const setUser = useCallback((user: AuthUser | null) => {
    if (user) {
      storage.setUser(user);
    } else {
      storage.removeUser();
    }
    setState((prev) => ({ ...prev, user }));
  }, []);

  // Compute profile completeness
  const profileCompleteness = useMemo(
    () => checkProfileCompleteness(state.profile),
    [state.profile],
  );

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshProfile,
    setUser,
    isProfileComplete: profileCompleteness.isComplete,
    profileCompleteness,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Hook for components that only need to know if user is authenticated
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}

/**
 * Hook to get current user (null if not authenticated)
 */
export function useCurrentUser() {
  const { user, profile, isLoading, isProfileComplete, profileCompleteness } =
    useAuth();
  return { user, profile, isLoading, isProfileComplete, profileCompleteness };
}
