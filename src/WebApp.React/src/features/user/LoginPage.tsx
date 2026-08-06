import { useEffect } from 'react';

export function LoginPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('returnUrl') ?? '/';
    try {
      const url = new URL(returnUrl, window.location.origin);
      // If the returnUrl is absolute and points to a different origin, redirect to /
      if (url.origin !== window.location.origin) {
        window.location.href = `/bff/login?returnUrl=${encodeURIComponent('/')}`;
      } else {
        window.location.href = `/bff/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      }
    } catch {
      window.location.href = `/bff/login?returnUrl=${encodeURIComponent('/')}`;
    }
  }, []);

  return null;
}
