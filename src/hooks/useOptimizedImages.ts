import { useState, useEffect } from 'react';

interface UseOptimizedImageProps {
  src: string;
  placeholder?: string;
  lazy?: boolean;
}

export const useOptimizedImage = ({ src, placeholder, lazy = true }: UseOptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver;
    const imageElement = new Image();

    const loadImage = () => {
      imageElement.src = src;
      imageElement.onload = () => {
        setImageSrc(src);
        setImageLoaded(true);
        setImageError(false);
      };
      imageElement.onerror = () => {
        setImageError(true);
        setImageLoaded(false);
      };
    };

    if (lazy && 'IntersectionObserver' in window) {
      // For lazy loading, vi starter med placeholder
      const targetElement = document.createElement('div');
      targetElement.dataset.src = src;
      
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(targetElement);
    } else {
      // Load immediately if not lazy or IntersectionObserver not supported
      loadImage();
    }

    return () => {
      if (observer) observer.disconnect();
      imageElement.onload = null;
      imageElement.onerror = null;
    };
  }, [src, lazy]);

  return { imageSrc, imageLoaded, imageError };
};

// Hook for preloading critical images
export const usePreloadImages = (images: string[]) => {
  const [preloadedImages, setPreloadedImages] = useState<string[]>([]);

  useEffect(() => {
    const loadPromises = images.map(src => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => reject(src);
        img.src = src;
      });
    });

    Promise.allSettled(loadPromises).then(results => {
      const loaded = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value);
      
      setPreloadedImages(loaded);
    });
  }, [images]);

  return preloadedImages;
};