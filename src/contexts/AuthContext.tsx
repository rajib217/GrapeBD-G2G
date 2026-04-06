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
  const bootstrappedRef = useRef(false);
  const activeUserIdRef = useRef<string | null>(null);
  const profileRequestRef = useRef(0);
  const sessionSyncRef = useRef(0);
  const nullSessionTimeoutRef = useRef<number | null>(null);

  const clearNullSessionRetry = () => {
    if (nullSessionTimeoutRef.current !== null) {
      window.clearTimeout(nullSessionTimeoutRef.current);
      nullSessionTimeoutRef.current = null;
    }
  };

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

  const resetAuthState = () => {
    profileRequestRef.current += 1;
    activeUserIdRef.current = null;
    setSession(null);
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
  };

  const applySession = (nextSession: Session | null) => {
    if (!isMountedRef.current) {
      return;
    }

    const nextUser = nextSession?.user ?? null;
    const nextUserId = nextUser?.id ?? null;
    const previousUserId = activeUserIdRef.current;

    activeUserIdRef.current = nextUserId;
    setSession(nextSession);
    setUser(nextUser);

    if (!nextUserId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    if (previousUserId !== nextUserId) {
      profileRequestRef.current += 1;
      setProfile(null);
      setProfileLoading(true);
    }
  };

  const syncSessionFromStorage = async () => {
    const syncId = ++sessionSyncRef.current;

    try {
      const { data: { session: restoredSession } } = await supabase.auth.getSession();

      if (!isMountedRef.current || sessionSyncRef.current !== syncId) {
        return;
      }

      if (restoredSession) {
        applySession(restoredSession);
      } else {
        resetAuthState();
      }
    } catch (error) {
      console.error('Session restore error:', error);

      if (!isMountedRef.current || sessionSyncRef.current !== syncId) {
        return;
      }

      resetAuthState();
    } finally {
      if (isMountedRef.current && sessionSyncRef.current === syncId) {
        bootstrappedRef.current = true;
        setAuthReady(true);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMountedRef.current) {
        return;
      }

      clearNullSessionRetry();

      if (nextSession) {
        sessionSyncRef.current += 1;
        applySession(nextSession);
        setAuthReady(true);
        return;
      }

      if (event === 'SIGNED_OUT') {
        sessionSyncRef.current += 1;
        resetAuthState();
        setAuthReady(true);
        return;
      }

      if (!bootstrappedRef.current) {
        return;
      }

      const scheduledSyncId = ++sessionSyncRef.current;
      nullSessionTimeoutRef.current = window.setTimeout(async () => {
        try {
          const { data: { session: restoredSession } } = await supabase.auth.getSession();

          if (!isMountedRef.current || sessionSyncRef.current !== scheduledSyncId) {
            return;
          }

          if (restoredSession) {
            applySession(restoredSession);
          } else {
            resetAuthState();
          }
        } catch (error) {
          console.error('Deferred session restore error:', error);

          if (!isMountedRef.current || sessionSyncRef.current !== scheduledSyncId) {
            return;
          }

          resetAuthState();
        }
      }, 250);
    });

    void syncSessionFromStorage();

    return () => {
      isMountedRef.current = false;
      profileRequestRef.current += 1;
      sessionSyncRef.current += 1;
      clearNullSessionRetry();
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const currentUserId = user?.id ?? null;

    if (!currentUserId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    const requestId = ++profileRequestRef.current;
    setProfileLoading(true);

    void fetchProfile(currentUserId)
      .then((profileData) => {
        if (
          !isMountedRef.current ||
          profileRequestRef.current !== requestId ||
          activeUserIdRef.current !== currentUserId
        ) {
          return;
        }

        setProfile(profileData);
        setProfileLoading(false);
      })
      .catch((error) => {
        console.error('Profile fetch error:', error);

        if (
          !isMountedRef.current ||
          profileRequestRef.current !== requestId ||
          activeUserIdRef.current !== currentUserId
        ) {
          return;
        }

        setProfile(null);
        setProfileLoading(false);
      });
  }, [authReady, user?.id]);

  const refreshProfile = async () => {
    const currentUserId = activeUserIdRef.current;
    if (!currentUserId) return;

    const requestId = ++profileRequestRef.current;
    setProfileLoading(true);

    const profileData = await fetchProfile(currentUserId);

    if (
      !isMountedRef.current ||
      profileRequestRef.current !== requestId ||
      activeUserIdRef.current !== currentUserId
    ) {
      return;
    }

    setProfile(profileData);
    setProfileLoading(false);
  };

  const signOut = async () => {
    try {
      const cleanupAuthState = () => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('supabase.auth.') || key.includes('sb-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));

        const sessionKeysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.startsWith('supabase.auth.') || key.includes('sb-'))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
      };

      sessionSyncRef.current += 1;
      clearNullSessionRetry();
      resetAuthState();
      setAuthReady(true);

      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.error('Supabase sign out error:', err);
      }

      cleanupAuthState();
      window.location.href = '/auth';
    } catch (error) {
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    profile,
    loading: !authReady || profileLoading,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
