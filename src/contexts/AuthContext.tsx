"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User, UserRole } from "@/types";

// Define the structure for user profile data from your database
interface UserProfile {
  id: string; // Should match auth.users.id
  email: string;
  role: UserRole;
  name: string;
  grade?: string;
  created_at: string; // Supabase uses snake_case
}

// Combine Supabase Auth user and your profile data
interface AppUser extends UserProfile {}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    name: string,
    grade?: string // Add grade if needed during signup
  ) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile based on Supabase user ID
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<AppUser | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles') // Assumes you have a 'profiles' table
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      return data as AppUser;
    } catch (err) {
      console.error("Exception fetching profile:", err);
      return null;
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const profile = await fetchUserProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
        // Adjust loading state based on event if needed, or keep initial load logic
        // setLoading(false); // Could set loading false here too
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Profile fetching is handled by onAuthStateChange
  };

  const signUp = async (
    email: string,
    password: string,
    role: UserRole,
    name: string,
    grade?: string
  ) => {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;

    // If signup is successful and user exists, create profile
    if (signUpData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id, // Link profile to the auth user
          email,
          role,
          name,
          grade,
          // created_at is usually handled by Supabase automatically
        });

      if (profileError) {
        console.error("Error creating profile after signup:", profileError);
        // Optional: Handle profile creation failure (e.g., delete the auth user?)
        throw profileError;
      }
      // The onAuthStateChange listener should pick up the new user and profile
    } else {
      // Handle case where user is null after signup (e.g., email confirmation required)
      console.warn("Supabase signUp returned successfully but user object is null. Email confirmation might be required.");
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
    // State updates (user/session to null) are handled by onAuthStateChange
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
