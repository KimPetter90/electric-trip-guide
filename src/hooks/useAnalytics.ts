import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAnalytics = () => {
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        await supabase.functions.invoke('track-analytics', {
          body: {
            page_path: window.location.pathname,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent
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
  page_path: string; 
  referrer?: string; 
  user_agent?: string; 
}) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    await supabase.functions.invoke('track-analytics', {
      body: eventData,
      headers: session ? {
        authorization: `Bearer ${session.access_token}`
      } : {}
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};