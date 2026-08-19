"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

const TABS = [
  { href: "/dashboard", label: "홈" },
  { href: "/workouts", label: "운동" },
  { href: "/diet", label: "식단" },
  { href: "/diet-recommend", label: "추천" },
  { href: "/inbody", label: "인바디" },
  { href: "/admin", label: "관리" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const initial = (user?.displayName || user?.email || "준")[0];

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-ivory">
      <div className="sticky top-0 z-10 border-b border-card-border bg-ivory/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-5 py-3.5">
          <Link href="/dashboard" className="text-base font-extrabold tracking-tight text-ink">
            Junny
          </Link>
          <button
            onClick={() => router.push("/admin")}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
            aria-label="설정"
          >
            {initial}
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[640px] flex-1 px-5 pb-[100px] pt-5">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-card-border bg-ivory/96 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[640px] px-1 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex-1 py-1 text-center text-[11px] font-bold"
                style={{ color: active ? "var(--color-brand)" : "var(--color-muted)" }}
              >
                <span
                  className="mx-auto mb-1 block h-1 w-1 rounded-full bg-brand"
                  style={{ opacity: active ? 1 : 0 }}
                />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
