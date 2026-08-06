import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

export function LogoutPage() {
  const { logout } = useAuthStore();

  useEffect(() => {
    void logout();
  }, [logout]);

  return null;
}
