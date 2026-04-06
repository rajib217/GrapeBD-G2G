import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  courier_address?: string;
  profile_image?: string;
  preferred_courier?: string;
  bio?: string;
  g2g_rounds_participated?: string[];
  role: 'admin' | 'member';
  status: 'active' | 'suspended' | 'pending';
  status_icon?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const isMountedRef = useRef(true);
  const profileRequestRef = useRef(0);
  const sessionEventRef = useRef(0);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;

    const requestId = ++profileRequestRef.current;
    setProfileLoading(true);

    const profileData = await fetchProfile(user.id);

    if (!isMountedRef.current || profileRequestRef.current !== requestId) {
      return;
    }

    setProfile(profileData);
    setProfileLoading(false);
  };

  const syncProfile = async (nextUser: User | null) => {
    const requestId = ++profileRequestRef.current;

    if (!nextUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const profileData = await fetchProfile(nextUser.id);

    if (!isMountedRef.current || profileRequestRef.current !== requestId) {
      return;
    }

    setProfile(profileData);
    setProfileLoading(false);
  };

  const syncSessionState = (nextSession: Session | null) => {
    if (!isMountedRef.current) {
      return;
    }

    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    void syncProfile(nextSession?.user ?? null);
  };

  useEffect(() => {
    isMountedRef.current = true;
    let initialSessionResolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!initialSessionResolved && event === 'INITIAL_SESSION') {
        return;
      }

      sessionEventRef.current += 1;
      syncSessionState(nextSession);

      if (!initialSessionResolved) {
        initialSessionResolved = true;
        setAuthReady(true);
      }
    });

    const initialSessionVersion = sessionEventRef.current;

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        if (!isMountedRef.current || initialSessionResolved) {
          return;
        }

        initialSessionResolved = true;

        if (sessionEventRef.current === initialSessionVersion) {
          syncSessionState(initialSession);
        }

        setAuthReady(true);
      })
      .catch((error) => {
        console.error('Session restore error:', error);

        if (!isMountedRef.current) {
          return;
        }

        initialSessionResolved = true;
        profileRequestRef.current += 1;
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileLoading(false);
        setAuthReady(true);
      });

    return () => {
      isMountedRef.current = false;
      profileRequestRef.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Clean up auth state first
      const cleanupAuthState = () => {
        // Clear all localStorage items related to auth
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase.auth.') || key.includes('sb-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Also clear sessionStorage if needed
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.startsWith('supabase.auth.') || key.includes('sb-'))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      };

      // Clear React state immediately
      profileRequestRef.current += 1;
      setUser(null);
      setSession(null);
      setProfile(null);
      setProfileLoading(false);
      setAuthReady(true);
      
      // Clean up storage
      cleanupAuthState();
      
      // Try to sign out from Supabase (ignore errors)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Ignore sign out errors, just continue
      }
      
      // Force redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      // Even if everything fails, still redirect
      window.location.href = '/auth';
    }
  };

  const loading = !authReady || profileLoading;

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
