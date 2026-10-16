import { useState, useEffect } from 'react';

/**
 * Hook to track iOS Safari dynamic visual viewport height.
 * Accurately auto-resizes when the URL bar expands/collapses,
 * or when the iOS virtual keyboard slides up.
 */
export function useVisualViewport(): number {
  const [viewportHeight, setViewportHeight] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return window.visualViewport.height;
    }
    return typeof window !== 'undefined' ? window.innerHeight : 800;
  });

  useEffect(() => {
    const handleUpdate = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleUpdate);
      window.visualViewport.addEventListener('scroll', handleUpdate);
    }
    window.addEventListener('resize', handleUpdate);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleUpdate);
        window.visualViewport.removeEventListener('scroll', handleUpdate);
      }
      window.removeEventListener('resize', handleUpdate);
    };
  }, []);

  return viewportHeight;
}
