"use client";

import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth, db } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean | null; // null until checked
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  markOnboardingCompleted: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth).catch((err) => console.error("Google 리다이렉트 로그인 실패:", err));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profileRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(profileRef);
          if (!snap.exists()) {
            await setDoc(profileRef, {
              displayName: firebaseUser.displayName ?? "",
              email: firebaseUser.email ?? "",
              photoURL: firebaseUser.photoURL ?? "",
              onboardingCompleted: false,
              createdAt: serverTimestamp(),
            });
            setOnboardingCompleted(false);
          } else {
            setOnboardingCompleted(Boolean(snap.data().onboardingCompleted));
          }
          setAuthError(null);
        } catch (err) {
          console.error("Firestore 프로필 로드/생성 실패:", err);
          setAuthError(err instanceof Error ? err.message : "Firestore 연결에 실패했어요.");
        }
      } else {
        setOnboardingCompleted(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithRedirect(auth, new GoogleAuthProvider());
  }, []);

  const signOutUser = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const markOnboardingCompleted = useCallback(() => {
    setOnboardingCompleted(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, onboardingCompleted, authError, signInWithGoogle, signOutUser, markOnboardingCompleted }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
