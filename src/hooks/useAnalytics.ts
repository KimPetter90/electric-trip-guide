import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Generate a persistent session ID for the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const useAnalytics = () => {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        await supabase.functions.invoke('track-analytics', {
          body: {
            sessionId: getSessionId(),
            pagePath: window.location.pathname,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent
          },
          headers: session ? {
            authorization: `Bearer ${session.access_token}`
          } : {}
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();
  }, []);
};

export const trackEvent = async (eventData: { 
  pagePath: string; 
  referrer?: string; 
  userAgent?: string; 
}) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    await supabase.functions.invoke('track-analytics', {
      body: {
        sessionId: getSessionId(),
        ...eventData
      },
      headers: session ? {
        authorization: `Bearer ${session.access_token}`
      } : {}
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};