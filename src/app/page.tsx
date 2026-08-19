"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, loading, onboardingCompleted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (onboardingCompleted === false) router.replace("/onboarding");
    else if (onboardingCompleted === true) router.replace("/dashboard");
  }, [loading, user, onboardingCompleted, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-ivory text-sm text-muted">
      불러오는 중...
    </div>
  );
}
