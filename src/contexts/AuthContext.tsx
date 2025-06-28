'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserData } from '@/types/user';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
            // Update last login time
            await updateDoc(doc(db, 'users', user.uid), {
              lastLoginAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      const userData: UserData = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        profileComplete: false,
        totalPlaytime: 0,
        gamesPlayed: 0,
        casesCompleted: 0,
        averageScore: 0,
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      setUserData(userData);
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        const userData: UserData = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          role: 'user',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          profileComplete: true, // Google provides basic profile info
          totalPlaytime: 0,
          gamesPlayed: 0,
          casesCompleted: 0,
          averageScore: 0,
        };
        
        await setDoc(doc(db, 'users', user.uid), userData);
        setUserData(userData);
        toast.success('Account created with Google successfully!');
      } else {
        // Update last login time for existing user
        await updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: new Date().toISOString(),
        });
        toast.success('Signed in with Google successfully!');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups for this site.');
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserData>) => {
    if (!user) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid), data);
      setUserData(prev => prev ? { ...prev, ...data } : null);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const value = {
    user,
    userData,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 