"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDietLogsForDate, getGoal } from "@/lib/data";
import { dayLabel, todayStr } from "@/lib/date-utils";
import type { DietLog, Goal } from "@/types";

const CIRCUMFERENCE = 326.7;

const QUICK_LINKS = [
  { href: "/workouts", title: "운동 기록", desc: "오늘 운동을 남겨보세요" },
  { href: "/diet", title: "식단 기록", desc: "위클리 캘린더로 관리해요" },
  { href: "/diet-recommend", title: "식단 추천", desc: "냉장고 재료 기반" },
  { href: "/inbody", title: "인바디 등록", desc: "사진으로 자동 인식" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    Promise.all([getGoal(user.uid), getDietLogsForDate(user.uid, todayStr())])
      .then(([g, logs]) => {
        if (ignore) return;
        setGoal(g);
        setDietLogs(logs);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  const consumedCalories = dietLogs.reduce((sum, l) => sum + l.totalCalories, 0);
  const consumedProtein = dietLogs.reduce((sum, l) => sum + l.totalProteinG, 0);
  const calorieTarget = goal?.calorieTarget ?? 0;
  const proteinTarget = goal?.proteinTarget ?? 0;
  const caloriePct = calorieTarget ? Math.min(100, Math.round((consumedCalories / calorieTarget) * 100)) : 0;
  const proteinPct = proteinTarget ? Math.min(100, Math.round((consumedProtein / proteinTarget) * 100)) : 0;
  const remCal = Math.max(0, Math.round(calorieTarget - consumedCalories));
  const remProt = Math.max(0, Math.round(proteinTarget - consumedProtein));
  const remainingText =
    remCal > 0 || remProt > 0 ? `칼로리 ${remCal}kcal · 단백질 ${remProt}g 남았어요` : "오늘 목표를 달성했어요";

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="text-xs text-muted">{dayLabel(todayStr())}</div>
        <div className="mt-0.5 text-xl font-bold text-ink">
          안녕하세요{user?.displayName ? `, ${user.displayName}님` : ""}
        </div>
      </div>

      <section className="rounded-[20px] border border-card-border bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
        <div className="mb-3.5 text-[13px] font-bold text-muted-dark">오늘의 섭취</div>
        {loading ? (
          <p className="text-sm text-muted">불러오는 중...</p>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-10">
              <DonutStat pct={caloriePct} label="칼로리" valueText={`${Math.round(consumedCalories)} / ${calorieTarget}kcal`} />
              <DonutStat pct={proteinPct} label="단백질" valueText={`${Math.round(consumedProtein)} / ${proteinTarget}g`} />
            </div>
            <div className="mt-3.5 text-center text-xs font-bold text-brand">{remainingText}</div>
          </>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-card-border bg-white p-4"
          >
            <div className="text-sm font-bold text-ink">{link.title}</div>
            <div className="mt-0.5 text-xs text-muted">{link.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DonutStat({ pct, label, valueText }: { pct: number; label: string; valueText: string }) {
  const dash = ((pct / 100) * CIRCUMFERENCE).toFixed(1);
  return (
    <div className="text-center">
      <svg width="104" height="104" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-track)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--color-ink)">
          {pct}%
        </text>
        <text x="60" y="72" textAnchor="middle" fontSize="8" fill="var(--color-muted)">
          {label}
        </text>
      </svg>
      <div className="mt-1 text-[11px] text-muted-dark">{valueText}</div>
    </div>
  );
}
