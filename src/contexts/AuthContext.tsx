import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthUser } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const toAuthUser = (sessionUser: SupabaseUser): AuthUser => ({
      uid: sessionUser.id,
      id: sessionUser.id,
      displayName: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email || null,
      email: sessionUser.email || null,
      photoURL: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null,
    });

    const syncProfile = async (currentUser: AuthUser) => {
      const { error } = await supabase.from('profiles').upsert({
        id: currentUser.uid,
        display_name: currentUser.displayName || 'Usuario',
        email: currentUser.email,
        avatar_url: currentUser.photoURL,
      });

      if (error) {
        console.warn('No se pudo sincronizar el perfil Supabase.', error);
      }
    };

    const loadSession = async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user ? toAuthUser(data.user) : null;
      setUser(currentUser);
      if (currentUser) await syncProfile(currentUser);
      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ? toAuthUser(session.user) : null;
      setUser(currentUser);
      if (currentUser) void syncProfile(currentUser);
      setLoading(false);
    });

    void loadSession();

    return () => listener.subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/home`,
      },
    });

    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
