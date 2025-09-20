
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
import { collection, query, where, getDocs, writeBatch, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, firstName: string, lastName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logOut: () => Promise<any>;
  updateUserPhoto: (file: File | Blob) => Promise<void>;
  updateUserProfile: (data: {displayName: string, bio?: string, dob?: Date, phone?: string}) => Promise<void>;
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
  
  const createUserInFirestore = async (user: User) => {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            uid: user.uid,
        });
      }
  }

  const signUp = async (email: string, pass: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, pass);
      const displayName = `${firstName} ${lastName}`;
      const defaultAvatarUrl = `https://picsum.photos/seed/${userCredential.user.uid}/100/100`;

      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: defaultAvatarUrl
      });
      
      const updatedUser = { ...userCredential.user, displayName, photoURL: defaultAvatarUrl };
      await createUserInFirestore(updatedUser as User);

      setUser(updatedUser);
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
      let finalUser = user;

      // Check if the user is new
      if (user.metadata.creationTime === user.metadata.lastSignInTime) {
        let photoURL = user.photoURL;
        if (!photoURL) {
            photoURL = `https://picsum.photos/seed/${user.uid}/100/100`;
            await updateProfile(user, { photoURL });
            finalUser = {...user, photoURL};
        }
      }
      await createUserInFirestore(finalUser);
      setUser(finalUser);
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
  
  const updateAllUserGeneratedContent = async (userId: string, updateData: {authorAvatarUrl?: string, authorName?: string}) => {
    const batch = writeBatch(db);
  
    // Update posts
    const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    postsSnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, updateData);
    });
  
    // Update comments
    // This is computationally expensive. For a real-world app, this might be better handled by a cloud function.
    const allPostsQuery = query(collection(db, 'posts'));
    const allPostsSnapshot = await getDocs(allPostsQuery);
  
    for (const postDoc of allPostsSnapshot.docs) {
      const comments = postDoc.data().comments || [];
       let commentsUpdated = false;
      const updatedComments = comments.map((comment: any) => {
        // This relies on having stored authorId in comment objects. 
        // If not, this part needs to be adapted. Assuming authorId is stored.
        if (comment.authorId === userId) {
          commentsUpdated = true;
          return {...comment, authorName: updateData.authorName ?? comment.authorName, authorAvatarUrl: updateData.authorAvatarUrl ?? comment.authorAvatarUrl};
        }
        return comment;
      });
      if(commentsUpdated) {
        batch.update(postDoc.ref, { comments: updatedComments });
      }
    }
    
    await batch.commit();
  };

  const updateUserPhoto = async (file: File | Blob) => {
    if (!user) throw new Error("You must be logged in to update your profile picture.");
    setLoading(true);
    
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
      
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { photoURL: photoURL }, { merge: true });

      await updateAllUserGeneratedContent(user.uid, { authorAvatarUrl: photoURL });

    } catch (error) {
      console.error("Error in updateUserPhoto:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during photo update.");
    } finally {
        setLoading(false);
    }
  };
  
  const updateUserProfile = async (data: {displayName: string, bio?: string, dob?: Date, phone?: string}) => {
    if (!user) throw new Error("You must be logged in to update your profile.");
    setLoading(true);

    try {
        const { displayName, ...profileData } = data;
        
        // Update Firebase Auth profile
        if (displayName !== user.displayName) {
            await updateProfile(user, { displayName });
            setUser({ ...user, displayName });
        }

        // Update Firestore 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { ...profileData, displayName }, { merge: true });
        
        if(displayName !== user.displayName){
           await updateAllUserGeneratedContent(user.uid, { authorName: displayName });
        }

    } catch (error) {
        console.error("Error updating user profile:", error);
        throw new Error("Failed to update profile.");
    } finally {
        setLoading(false);
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logOut,
    updateUserPhoto,
    updateUserProfile,
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
