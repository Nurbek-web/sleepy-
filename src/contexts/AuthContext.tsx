"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    name: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        console.log("Auth state changed:", firebaseUser?.email);
        if (firebaseUser) {
          // Set the auth token cookie
          const token = await firebaseUser.getIdToken();
          document.cookie = `auth-token=${token}; path=/`;

          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          console.log(
            "User doc exists:",
            userDoc.exists(),
            "User data:",
            userDoc.data()
          );
          if (userDoc.exists()) {
            const userData = {
              id: firebaseUser.uid,
              ...userDoc.data(),
            } as User;
            console.log("Setting user state:", userData);
            setUser(userData);
          } else {
            console.log("User document doesn't exist in Firestore");
            setUser(null);
          }
        } else {
          // Clear the auth token cookie
          document.cookie =
            "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          console.log("No Firebase user, setting user state to null");
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in...");
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful:", result.user.uid);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    name: string
  ) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userData: Omit<User, "id"> = {
      email,
      role,
      name,
      createdAt: new Date(),
    };
    await setDoc(doc(db, "users", firebaseUser.uid), userData);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
