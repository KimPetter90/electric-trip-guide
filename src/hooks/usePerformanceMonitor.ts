import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  firstPaint: number;
  firstContentfulPaint: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useRef(performance.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;

    // Log performance i development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Performance [${componentName}]:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        renderCount: renderCount.current
      });
    }

    // Warn om lang render-tid
    if (renderTime > 100) {
      console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
  });

  // Måle og rapporter Web Vitals
  useEffect(() => {
    if ('performance' in window && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log(`📏 LCP: ${entry.startTime.toFixed(2)}ms`);
          }
          
          if (entry.entryType === 'first-input') {
            console.log(`👆 FID: ${(entry as any).processingStart - entry.startTime}ms`);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] });
      } catch (error) {
        console.warn('Performance observation not supported:', error);
      }

      return () => observer.disconnect();
    }
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    startTime: startTime.current
  };
};

// Hook for monitoring memory usage
export const useMemoryMonitor = () => {
  useEffect(() => {
    const logMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('🧠 Memory Usage:', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        });
      }
    };

    const interval = setInterval(logMemoryUsage, 30000); // Hver 30 sekund
    return () => clearInterval(interval);
  }, []);
};