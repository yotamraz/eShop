import { useEffect } from 'react';

export function usePageHeader(title: string, subtitle: string) {
  useEffect(() => {
    const titleEl = document.getElementById('page-header-title');
    const subtitleEl = document.getElementById('page-header-subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    return () => {
      if (titleEl) titleEl.textContent = '';
      if (subtitleEl) subtitleEl.textContent = '';
    };
  }, [title, subtitle]);
}
