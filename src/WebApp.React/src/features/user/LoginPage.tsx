import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

export function LoginPage() {
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl') ?? undefined;
    login(returnUrl);
  }, [login]);

  return null;
}
