"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "홈", icon: "🏠" },
  { href: "/workouts", label: "운동", icon: "🏋️" },
  { href: "/diet", label: "식단", icon: "🍽️" },
  { href: "/diet-recommend", label: "추천", icon: "🥗" },
  { href: "/inbody", label: "인바디", icon: "📊" },
  { href: "/admin", label: "관리", icon: "⚙️" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="text-base font-bold tracking-tight">
          Junny Workout
        </Link>
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" />
          )}
          <button
            onClick={() => signOutUser().then(() => router.replace("/login"))}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  active ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
