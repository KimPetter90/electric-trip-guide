// Accessibility utility functions

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return;
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  firstElement.focus();
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

export const setupKeyboardNavigation = (
  container: HTMLElement,
  items: NodeListOf<HTMLElement> | HTMLElement[],
  options: {
    wrap?: boolean;
    homeEndKeys?: boolean;
    typeahead?: boolean;
  } = {}
) => {
  const { wrap = true, homeEndKeys = true, typeahead = false } = options;
  let currentIndex = 0;
  let typeaheadString = '';
  let typeaheadTimeout: NodeJS.Timeout;
  
  const moveFocus = (index: number) => {
    if (index < 0) {
      currentIndex = wrap ? items.length - 1 : 0;
    } else if (index >= items.length) {
      currentIndex = wrap ? 0 : items.length - 1;
    } else {
      currentIndex = index;
    }
    
    (items[currentIndex] as HTMLElement).focus();
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        moveFocus(currentIndex + 1);
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        moveFocus(currentIndex - 1);
        break;
        
      case 'Home':
        if (homeEndKeys) {
          e.preventDefault();
          moveFocus(0);
        }
        break;
        
      case 'End':
        if (homeEndKeys) {
          e.preventDefault();
          moveFocus(items.length - 1);
        }
        break;
        
      default:
        if (typeahead && e.key.length === 1) {
          typeaheadString += e.key.toLowerCase();
          clearTimeout(typeaheadTimeout);
          
          // Find matching item
          for (let i = 0; i < items.length; i++) {
            const item = items[i] as HTMLElement;
            const text = item.textContent?.toLowerCase() || '';
            if (text.startsWith(typeaheadString)) {
              moveFocus(i);
              break;
            }
          }
          
          typeaheadTimeout = setTimeout(() => {
            typeaheadString = '';
          }, 1000);
        }
        break;
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    clearTimeout(typeaheadTimeout);
  };
};

export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = color.replace(/[^\d,]/g, '').split(',').map(Number);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

export const hasGoodContrast = (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
};

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Screen reader only CSS class utility
export const srOnlyClass = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';