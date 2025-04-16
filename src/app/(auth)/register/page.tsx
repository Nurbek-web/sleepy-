"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Mail, Lock, User, ArrowRight, Moon, Sparkles, Eye, EyeOff, AlertTriangle } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    // Basic validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (!name) {
      setError("Please enter your full name");
      return;
    }
    if (!email) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(email, password, role, name); // Assuming grade is optional and not collected here
      // Wait for the auth state listener to potentially set the user
      // or handle cases where email confirmation is needed.
      // Redirecting immediately might be too soon if email confirmation is enabled.
      // Consider showing a "Check your email" message instead.
      // For now, we'll keep the redirect, but be aware of this.
      router.push("/dashboard"); 
    } catch (err: any) {
      // Extract meaningful error message from Supabase error
      let errorMessage = err?.message || "Failed to create account. Please try again.";
      
      // Customize based on common Supabase auth errors
      if (errorMessage.toLowerCase().includes("user already registered")) {
        errorMessage = "Email is already in use. Please use a different email or sign in.";
      } else if (errorMessage.toLowerCase().includes("password should be at least 6 characters")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (errorMessage.toLowerCase().includes("unable to validate email address")) {
        errorMessage = "Please enter a valid email address.";
      } else if (errorMessage.toLowerCase().includes("rate limit exceeded")) {
        errorMessage = "Too many attempts. Please try again later.";
      } else if (errorMessage.toLowerCase().includes("failed to fetch")) { // General network error
        errorMessage = "Network error. Please check your connection.";
      }
      
      console.error("Supabase sign up error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 animate-pulse-slow">
            <Moon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sleepy</h1>
          <p className="mt-2 text-sm text-gray-600">Track your sleep, improve your rest</p>
        </div>
        
        <Card className="w-full border-none shadow-lg bg-white/90 backdrop-blur-sm animate-fade-up">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md flex items-start gap-2 animate-shake">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="relative group">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-primary" />
                  <Input
                    type="text"
                    placeholder="Full name"
                    className="pl-10 h-10 bg-gray-50 border-gray-200 focus:border-primary transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-primary" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    className="pl-10 h-10 bg-gray-50 border-gray-200 focus:border-primary transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative group">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-primary" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="pl-10 pr-10 h-10 bg-gray-50 border-gray-200 focus:border-primary transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1 pl-1">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="relative group">
                  <Sparkles className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 transition-colors group-focus-within:text-primary" />
                  <select
                    className="w-full h-10 pl-10 rounded-md border border-gray-200 bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex-col space-y-4">
            <div className="h-px w-full bg-gray-100"></div>
            <div className="text-center text-sm">
              <span className="text-gray-500">Already have an account?</span>{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-primary/90 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// This is needed for Next.js error handling
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="p-6 max-w-sm bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-700 mb-4">{error.message}</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to home
        </Link>
      </div>
    </div>
  );
}

// This provides a loading state for the page
export function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex flex-col items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
