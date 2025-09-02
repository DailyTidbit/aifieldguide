import { useState, useEffect } from 'react';
import { getSupabaseBrowserClientSafe } from '../lib/supabaseClient';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mounted: boolean;
}

export const useSafeAuth = (initialUser?: any): AuthState => {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClientSafe();
        
        // CRITICAL FIX: Handle null supabase client properly
        if (!supabase) {
          console.warn('Supabase client not available during auth check');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error && error.message !== 'Auth session missing!') {
          console.error('Auth error:', error);
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Only run auth check after mount
    if (mounted) {
      checkAuth();
      
      // Set up auth state listener - with null check
      const supabase = getSupabaseBrowserClientSafe();
      if (supabase) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('Auth state changed:', event);
            setUser(session?.user ?? null);
            setIsLoading(false);
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      }
    }
  }, [mounted]);

  return {
    user: mounted ? user : null,
    isLoading: !mounted || isLoading,
    isAuthenticated: mounted && !!user,
    mounted
  };
};