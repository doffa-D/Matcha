import { Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/context";
import { Loader2 } from "lucide-react";

/**
 * Routes that are exempt from profile completeness check
 * Users need access to these to complete their profile or manage account
 */
const PROFILE_EXEMPT_ROUTES = ["/me", "/logout"];

/**
 * ProtectedRoute - Wraps routes that require authentication
 *
 * Usage in route file:
 * ```tsx
 * export const Route = createFileRoute('/discover/')({
 *   component: () => (
 *     <ProtectedRoute>
 *       <DiscoverPage />
 *     </ProtectedRoute>
 *   ),
 * });
 * ```
 *
 * Or use as a layout route wrapper
 */

interface ProtectedRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile, isProfileComplete } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-matcha" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Pass current location as state so we can redirect back after login
    return (
      <Navigate
        to={redirectTo}
        search={{ redirect: location.pathname } as any}
        replace
      />
    );
  }

  // Check if current route is exempt from profile completeness check
  const isExemptRoute = PROFILE_EXEMPT_ROUTES.some((route) =>
    location.pathname.startsWith(route),
  );

  // Redirect to profile page if profile is incomplete (and not on exempt route)
  // Only check once profile data is loaded
  if (!isExemptRoute && profile && !isProfileComplete) {
    return <Navigate to="/me" search={{ incomplete: "true" }} replace />;
  }

  // Render children or outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
}

/**
 * GuestRoute - Only accessible when NOT authenticated
 * Useful for login/register pages
 */
interface GuestRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export function GuestRoute({
  children,
  redirectTo = "/discover",
}: GuestRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-matcha" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to app if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render children or outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
}
