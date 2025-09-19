
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
import { auth as firebaseAuth, googleProvider, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from '../ui/skeleton';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, firstName: string, lastName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logOut: () => Promise<any>;
  updateUserPhoto: (blob: Blob) => Promise<void>;
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

  const updateUserPhoto = async (blob: Blob) => {
    if (!user) throw new Error("You must be logged in to update your profile picture.");
    
    // Create a unique filename for the new avatar
    const fileName = `${Date.now()}.jpg`;
    const storageRef = ref(storage, `avatars/${user.uid}/${fileName}`);

    try {
      // Step 1: Upload the file with metadata
      try {
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
      } catch (error) {
        console.error("Firebase Storage upload failed:", error);
        throw new Error("Failed to upload image to storage. Check storage rules and configuration.");
      }

      // Step 2: Get the download URL
      let photoURL;
      try {
        photoURL = await getDownloadURL(storageRef);
      } catch (error) {
        console.error("Failed to get download URL:", error);
        throw new Error("Image uploaded, but failed to get the public URL.");
      }
      
      // Step 3: Update the user's profile
      try {
        await updateProfile(user, { photoURL });
      } catch (error) {
        console.error("Failed to update user profile:", error);
        throw new Error("Failed to update profile with new image URL.");
      }
      
      // Step 4: Update local user state to trigger re-render
      setUser({ ...user, photoURL }); 

    } catch (error) {
      console.error("Overall error in updateUserPhoto:", error);
      // Re-throw the specific error from the inner try-catch blocks
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
