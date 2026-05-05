import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthUser } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileAvatar: (avatarId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const toAuthUser = (sessionUser: SupabaseUser): AuthUser => {
    const profileAvatarId = typeof sessionUser.user_metadata?.profile_avatar_id === 'string'
      ? sessionUser.user_metadata.profile_avatar_id
      : null;

    return {
      uid: sessionUser.id,
      id: sessionUser.id,
      displayName: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email || null,
      email: sessionUser.email || null,
      photoURL: profileAvatarId ? null : sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null,
      profileAvatarId,
    };
  };

  const syncProfile = async (currentUser: AuthUser) => {
    const { error } = await supabase.from('profiles').upsert({
      id: currentUser.uid,
      display_name: currentUser.displayName || 'Usuario',
      email: currentUser.email,
      avatar_url: currentUser.profileAvatarId ? `plant-avatar:${currentUser.profileAvatarId}` : currentUser.photoURL,
    });

    if (error) {
      console.warn('No se pudo sincronizar el perfil Supabase.', error);
    }
  };

  useEffect(() => {
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

  const updateProfileAvatar = async (avatarId: string) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { profile_avatar_id: avatarId },
    });

    if (error) throw error;

    const updatedUser = data.user
      ? toAuthUser(data.user)
      : user
        ? { ...user, photoURL: null, profileAvatarId: avatarId }
        : null;

    setUser(updatedUser);
    if (updatedUser) await syncProfile(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateProfileAvatar }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
