"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { user, loading, onboardingCompleted, authError, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    router.replace(onboardingCompleted ? "/dashboard" : "/onboarding");
  }, [loading, user, onboardingCompleted, router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-[18px] bg-ivory px-6 text-center">
      <div className="text-[13px] font-semibold text-muted">Junny Workout</div>
      <h1 className="mx-auto max-w-[280px] text-[22px] font-bold leading-[1.5] text-ink">
        운동, 식단, 인바디를 한 곳에서 관리해요
      </h1>
      <p className="text-[13px] leading-[1.6] text-muted">
        Google 계정으로 로그인하면 바로 시작할 수 있어요.
      </p>
      <button
        onClick={() => signInWithGoogle().catch(console.error)}
        disabled={loading}
        className="mt-3.5 flex items-center gap-3 rounded-full border border-input-border bg-white px-6 py-3.5 text-[15px] font-bold text-ink shadow-sm transition hover:bg-ivory disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
        </svg>
        Google로 시작하기
      </button>
      {authError && <p className="max-w-[280px] text-xs text-danger">{authError}</p>}
    </main>
  );
}
