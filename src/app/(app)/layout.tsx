"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingCompleted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (onboardingCompleted === false) {
      router.replace("/onboarding");
    }
  }, [loading, user, onboardingCompleted, router]);

  if (loading || !user || onboardingCompleted !== true) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
        불러오는 중...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
