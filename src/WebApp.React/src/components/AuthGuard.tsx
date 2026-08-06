import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, login } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login(window.location.pathname);
    }
  }, [isLoading, isAuthenticated, login]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
