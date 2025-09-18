'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, firstName: string, lastName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const authInstance = firebaseAuth;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authInstance]);

  const signUp = async (email: string, pass: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass);
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });
      setUser(userCredential.user);
      return userCredential;
    } finally {
      setLoading(false);
    }
  };

  const signIn = (email: string, pass: string) => {
    setLoading(true);
    try {
        return signInWithEmailAndPassword(authInstance, email, pass);
    } finally {
        setLoading(false);
    }
  };

  const signInWithGoogle = () => {
    setLoading(true);
    try {
      return signInWithPopup(authInstance, googleProvider);
    } finally {
      setLoading(false);
    }
  }

  const logOut = () => {
    setLoading(true);
    try {
        return signOut(authInstance);
    } finally {
        setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logOut,
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
