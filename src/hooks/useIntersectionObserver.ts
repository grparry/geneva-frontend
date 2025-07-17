/**
 * Intersection Observer hook for lazy loading and visibility detection
 */

import { useEffect, useState, RefObject } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  options: IntersectionObserverOptions = {}
): {
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
} => {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false,
  } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      return;
    }

    let observer: IntersectionObserver | null = null;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);

      // Unobserve after first intersection if triggerOnce is true
      if (triggerOnce && entry.isIntersecting && observer) {
        observer.unobserve(element);
      }
    };

    observer = new IntersectionObserver(observerCallback, {
      root,
      rootMargin,
      threshold,
    });

    observer.observe(element);

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [elementRef, root, rootMargin, threshold, triggerOnce]);

  return { isIntersecting, entry };
};

export default useIntersectionObserver;