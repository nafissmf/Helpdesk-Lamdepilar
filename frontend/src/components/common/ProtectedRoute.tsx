import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getDefaultHomePath } from "../../utils/homePath";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string | string[];
  fallback?: ReactNode;
}

/**
 * Melindungi route berdasarkan permission.
 * Jika tidak punya izin, arahkan ke halaman home yang boleh diakses (bukan 404 palsu).
 */
export default function ProtectedRoute({
  children,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const { hasPermission, isLoading, isSessionTransitioning, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading || isSessionTransitioning) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) return <>{fallback}</>;
    const home = getDefaultHomePath(hasPermission);
    if (home === location.pathname) {
      return <Navigate to="/profile" replace />;
    }
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}
