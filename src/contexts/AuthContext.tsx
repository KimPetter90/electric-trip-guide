import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_status: 'free' | 'premium' | 'pro';
  product_id: string | null;
  subscription_end: string | null;
  route_count: number;
  route_limit: number;
}

interface FavoriteCar {
  id: string;
  car_id: string;
  car_brand: string;
  car_model: string;
  battery_capacity: number;
  range_km: number;
  consumption: number;
  car_image?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: SubscriptionInfo | null;
  favoriteCar: FavoriteCar | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  saveFavoriteCar: (car: any) => Promise<void>;
  removeFavoriteCar: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [favoriteCar, setFavoriteCar] = useState<FavoriteCar | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async (currentSession: Session | null, retryCount = 0) => {
    if (!currentSession) {
      setSubscription(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        throw error;
      }
      
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      
      // Retry logic for network errors
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          checkSubscription(currentSession, retryCount + 1);
        }, delay);
        return;
      }
      
      // Fallback til gratis abonnement
      setSubscription({
        subscribed: false,
        subscription_status: 'free',
        product_id: null,
        subscription_end: null,
        route_count: 0,
        route_limit: 25
      });
    }
  };

  const refreshSubscription = async () => {
    if (session) {
      await checkSubscription(session);
    }
  };

  const loadFavoriteCar = async (userId: string, retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('favorite_car')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      setFavoriteCar(data);
    } catch (error) {
      console.error('Error loading favorite car:', error);
      
      // Retry for network errors
      if (retryCount < 2) {
        setTimeout(() => {
          loadFavoriteCar(userId, retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
    }
  };

  const saveFavoriteCar = async (car: any) => {
    if (!user) return;
    
    try {
      const favData = {
        user_id: user.id,
        car_id: car.id,
        car_brand: car.brand,
        car_model: car.model,
        battery_capacity: car.batteryCapacity,
        range_km: car.range,
        consumption: car.consumption,
        car_image: car.image
      };

      const { error } = await supabase
        .from('favorite_car')
        .upsert(favData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error('Error saving favorite car:', error);
        return;
      }
      
      // Reload favorite car from database to get the complete object
      await loadFavoriteCar(user.id);
    } catch (error) {
      console.error('Error saving favorite car:', error);
    }
  };

  const removeFavoriteCar = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('favorite_car')
        .delete()
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error removing favorite car:', error);
        return;
      }
      
      setFavoriteCar(null);
    } catch (error) {
      console.error('Error removing favorite car:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check subscription and favorite car after auth state changes
        if (session?.user) {
          setTimeout(() => {
            checkSubscription(session);
            loadFavoriteCar(session.user.id);
          }, 0);
        } else {
          setSubscription(null);
          setFavoriteCar(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkSubscription(session);
          loadFavoriteCar(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  // Auto-refresh subscription every minute for active users
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      checkSubscription(session);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [session]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      subscription,
      favoriteCar,
      loading,
      refreshSubscription,
      saveFavoriteCar,
      removeFavoriteCar,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}