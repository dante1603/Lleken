import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      try {
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              name: currentUser.displayName || 'Usuario',
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              plan: 'free',
              ownedPlantLimit: 3,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          } else {
            const data = userSnap.data();
            await setDoc(userRef, {
              name: currentUser.displayName || data.name || 'Usuario',
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              plan: data.plan || 'free',
              ownedPlantLimit: data.ownedPlantLimit || 3,
              updatedAt: Date.now(),
            }, { merge: true });
          }
        }
      } catch (error) {
        console.warn('No se pudo sincronizar el perfil de usuario. Revisa reglas de Firestore para users/{uid}.', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
