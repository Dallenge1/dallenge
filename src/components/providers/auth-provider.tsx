
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
  getAuth,
  deleteUser,
} from 'firebase/auth';
import { auth as firebaseAuth, googleProvider, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Skeleton } from '../ui/skeleton';
import { collection, query, where, getDocs, writeBatch, doc, setDoc, getDoc, serverTimestamp, increment, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, firstName: string, lastName: string, referralId?: string | null) => Promise<any>;
  signInWithGoogle: (referralId?: string | null) => Promise<any>;
  logOut: () => Promise<any>;
  updateUserPhoto: (file: File | Blob) => Promise<void>;
  updateUserProfile: (data: {displayName: string, bio?: string, dob?: Date, phone?: string}) => Promise<void>;
  deleteCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const authInstance = firebaseAuth;
  
  const updateUserPresence = async (userId: string, status: 'online' | 'offline') => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    try {
        await setDoc(userRef, {
            status: status,
            lastSeen: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error updating presence:", error);
    }
  };

  const createUserInFirestore = async (user: User, referralId: string | null = null) => {
    const userRef = doc(db, 'users', user.uid);
    const referrerRef = referralId ? doc(db, 'users', referralId) : null;

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(userRef);
        if (docSnap.exists()) {
          return; // User already exists, do nothing.
        }

        // Set the new user's document with initial coins
        transaction.set(userRef, {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            uid: user.uid,
            followers: [],
            following: [],
            coins: 100, // All new users start with 100 coins
            inventory: [],
            status: 'online',
            lastSeen: serverTimestamp(),
        }, { merge: true });

        // If there's a valid referrer, increment their coins
        if (referrerRef) {
          const referrerSnap = await transaction.get(referrerRef);
          if (referrerSnap.exists()) {
            transaction.update(referrerRef, { coins: increment(1000) });
          }
        }
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
      throw new Error("Failed to create user account in database.");
    }
}


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        setUser(user);
        updateUserPresence(user.uid, 'online');
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Handle user leaving the site
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if(authInstance.currentUser) {
            updateUserPresence(authInstance.currentUser.uid, 'offline');
        }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        unsubscribe();
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [authInstance]);
  

  const signUp = async (email: string, pass: string, firstName: string, lastName: string, referralId: string | null = null) => {
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
      await createUserInFirestore(updatedUser as User, referralId);

      setUser(authInstance.currentUser); // Use the fresh user from auth
      return userCredential;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const userCredential = await signInWithEmailAndPassword(authInstance, email, pass);
        return userCredential;
    } finally {
        setLoading(false);
    }
  };

  const signInWithGoogle = async (referralId: string | null = null) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(authInstance, googleProvider);
      const user = result.user;
      await createUserInFirestore(user, referralId);
      setUser(user);
      return result;
    } finally {
      setLoading(false);
    }
  }

  const logOut = async () => {
    setLoading(true);
    try {
        if(user) {
            await updateUserPresence(user.uid, 'offline');
        }
        return signOut(authInstance);
    } finally {
        setLoading(false);
    }
  };

  const deleteCurrentUser = async () => {
    if (!user) throw new Error("No user is logged in to delete.");
    setLoading(true);
    try {
        await deleteUser(user);
        setUser(null);
    } catch(error) {
        console.error("Error deleting user from Firebase Auth:", error);
        throw error;
    } finally {
        setLoading(false);
    }
  }
  
  const updateAllUserGeneratedContent = async (userId: string, updateData: {authorAvatarUrl?: string, authorName?: string}) => {
    const batch = writeBatch(db);
  
    // Update posts
    const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    postsSnapshot.forEach(docSnap => {
      batch.update(docSnap.ref, updateData);
    });
  
    // Update comments
    const allPostsQuery = query(collection(db, 'posts'));
    const allPostsSnapshot = await getDocs(allPostsQuery);
  
    for (const postDoc of allPostsSnapshot.docs) {
      const comments = postDoc.data().comments || [];
       let commentsUpdated = false;
      const updatedComments = comments.map((comment: any) => {
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
      setUser(authInstance.currentUser);
      
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
        }

        // Update Firestore 'users' collection
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { 
            displayName,
            bio: profileData.bio,
            dob: profileData.dob,
            phone: profileData.phone
        }, { merge: true });
        
        if(displayName !== user.displayName){
           await updateAllUserGeneratedContent(user.uid, { authorName: displayName });
        }
        
        // Refresh user state from auth to ensure it's the latest object
        setUser(authInstance.currentUser);

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
    deleteCurrentUser,
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

    