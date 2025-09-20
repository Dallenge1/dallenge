
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '../ui/skeleton';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, firstName: string, lastName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logOut: () => Promise<any>;
  updateUserPhoto: (file: File | Blob) => Promise<void>;
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
      // Create a default avatar for the user
      const defaultAvatarUrl = `https://picsum.photos/seed/${userCredential.user.uid}/100/100`;
       await updateProfile(userCredential.user, {
        photoURL: defaultAvatarUrl
      });
      setUser({ ...userCredential.user, photoURL: defaultAvatarUrl });
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

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(authInstance, googleProvider);
      const user = result.user;
      // Check if the user is new
      if (user.metadata.creationTime === user.metadata.lastSignInTime) {
        // New user
        if (!user.photoURL) {
            const defaultAvatarUrl = `https://picsum.photos/seed/${user.uid}/100/100`;
            await updateProfile(user, {
                photoURL: defaultAvatarUrl
            });
            setUser({ ...user, photoURL: defaultAvatarUrl });
        }
      }
      return result;
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
  
  const updateAllUserPostsAndComments = async (userId: string, newPhotoURL: string) => {
    const batch = writeBatch(db);
  
    // Update posts
    const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    postsSnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, { authorAvatarUrl: newPhotoURL });
    });
  
    // Update comments
    const allPostsQuery = query(collection(db, 'posts'));
    const allPostsSnapshot = await getDocs(allPostsQuery);
  
    for (const postDoc of allPostsSnapshot.docs) {
      const comments = postDoc.data().comments || [];
      const updatedComments = comments.map((comment: any) => {
        // This part is tricky as we don't store userId in comments.
        // This assumes authorName is unique, which is not a good assumption.
        // For a real app, you would need to store the authorId in the comment object.
        // We will skip comment avatar updates for now to avoid incorrect updates.
        return comment;
      });
      // batch.update(postDoc.ref, { comments: updatedComments });
    }
    
    await batch.commit();
  };

  const updateUserPhoto = async (file: File | Blob) => {
    if (!user) throw new Error("You must be logged in to update your profile picture.");
    
    let fileToUpload: File;

    if (file instanceof Blob && !(file instanceof File)) {
        fileToUpload = new File([file], `profile-${user.uid}.jpg`, { type: 'image/jpeg' });
    } else {
        fileToUpload = file as File;
    }

    try {
      const fileRef = ref(storage, `avatars/${user.uid}/${fileToUpload.name}`);
      const snapshot = await uploadBytes(fileRef, fileToUpload);
      const photoURL = await getDownloadURL(snapshot.ref);

      await updateProfile(user, { photoURL });
      setUser({ ...user, photoURL });
      
      // After updating profile, update all existing posts with new avatar URL
      await updateAllUserPostsAndComments(user.uid, photoURL);


    } catch (error) {
      console.error("Error in updateUserPhoto:", error);
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

    