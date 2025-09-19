
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
  updateUserPhoto: (file: File) => Promise<void>;
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

  const updateUserPhoto = async (file: File) => {
    if (!user) throw new Error("You must be logged in to update your profile picture.");
    
    const imgbbApiKey = 'a12aae9588a45f9b3b1e1793a67c5a5f';
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Step 1: Upload the file to ImgBB
      console.log('Uploading to ImgBB...');
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ImgBB upload failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`ImgBB API error: ${result.error.message}`);
      }
      
      const photoURL = result.data.display_url;
      console.log('ImgBB upload successful. URL:', photoURL);

      // Step 2: Update the user's profile in Firebase Auth
      console.log('Updating Firebase profile...');
      await updateProfile(user, { photoURL });
      console.log('Firebase profile updated.');
      
      // Step 3: Update local user state to trigger re-render
      setUser({ ...user, photoURL }); 

    } catch (error) {
      console.error("Overall error in updateUserPhoto:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during photo update.");
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logOut,
    updateUserPhoto
  };

  if (loading && !user) {
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
