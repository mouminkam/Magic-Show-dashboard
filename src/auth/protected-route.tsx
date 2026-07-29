import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';
import { LoadingScreen } from '@/components/ui/states';

/**
 * Gates every console route behind a session. Unauthenticated visitors are
 * bounced to /login with the attempted location so a post-login redirect can
 * send them back where they meant to go.
 */
export function ProtectedRoute() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
