
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

type UserRole = 'admin' | 'receptionist' | 'waiter' | null;

export type User = {
  email: string | null;
  uid: string;
  isAnonymous: boolean;
  role: UserRole;
  isAdmin: boolean;
  isReceptionist: boolean;
  isWaiter: boolean;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, pass: string) => Promise<{ user: User | null, error: any }>;
  signup: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

function AuthLoadingScreen() {
    return (
        <div className="flex items-center justify-center h-screen w-screen bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const role = (idTokenResult.claims.role as UserRole) || null;
        
        setUser({
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            isAnonymous: firebaseUser.isAnonymous,
            role: role,
            isAdmin: role === 'admin',
            isReceptionist: role === 'receptionist',
            isWaiter: role === 'waiter'
        });
        setIsLoading(false);
      } else {
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign in failed:", error);
        }).finally(() => {
            setIsLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;
        // Force refresh the token to get the latest custom claims.
        const idTokenResult = await firebaseUser.getIdTokenResult(true); 
        const role = (idTokenResult.claims.role as UserRole) | null;
        
        const appUser: User = {
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            isAnonymous: firebaseUser.isAnonymous,
            role: role,
            isAdmin: role === 'admin',
            isReceptionist: role === 'receptionist',
            isWaiter: role === 'waiter'
        };

        // The onAuthStateChanged listener will also update the global state,
        // but returning the user here allows for immediate action in the component.
        return { user: appUser, error: null };
    } catch (error) {
        return { user: null, error: error };
    }
  };

  const signup = async (email: string, pass: string) => {
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
        // After signup, Firebase automatically signs the user in.
        // We sign them out so they are forced to login, and the app state is reset to anonymous.
        await signOut(auth);
        return null;
    } catch (error) {
        return error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
