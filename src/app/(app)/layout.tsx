"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingCompleted, authError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (onboardingCompleted === false) {
      router.replace("/onboarding");
    }
  }, [loading, user, onboardingCompleted, router]);

  if (authError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-ivory px-6 text-center">
        <p className="text-sm font-semibold text-danger">데이터를 불러오지 못했어요</p>
        <p className="max-w-sm text-xs text-muted">{authError}</p>
        <p className="mt-2 max-w-sm text-xs text-muted">
          Firestore 보안 규칙이 배포되어 있는지 확인해주세요 (firebase deploy --only firestore:rules).
        </p>
      </div>
    );
  }

  if (loading || !user || onboardingCompleted !== true) {
    return (
      <div className="flex flex-1 items-center justify-center bg-ivory text-sm text-muted">
        불러오는 중...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
