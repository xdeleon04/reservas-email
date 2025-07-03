
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

type User = {
  email: string | null;
  uid: string;
  isAnonymous: boolean;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => void;
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
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            isAnonymous: firebaseUser.isAnonymous
        });
        setIsLoading(false);
      } else {
        // If no user is signed in (e.g. after logout or on first visit), sign in anonymously
        signInAnonymously(auth).catch((error) => {
            console.error("Anonymous sign in failed:", error);
            setIsLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        router.push("/admin");
        return null; // Success
    } catch (error) {
        return error; // Return error object to the form
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    signOut(auth).then(() => {
        router.push("/login");
    });
  };

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
