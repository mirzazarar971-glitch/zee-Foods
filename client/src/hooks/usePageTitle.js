import { useEffect } from 'react';

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Zee Foods` : 'Zee Foods — Cravings? We’ve Got You Covered!';
  }, [title]);
}
