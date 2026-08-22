"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getGoal,
  getGymSettings,
  getSharedExercises,
  getUserProfile,
  restartOnboarding,
  saveGoal,
  saveGymSettings,
  saveUserProfile,
  toggleFavoriteExercise,
} from "@/lib/data";
import { getExerciseById } from "@/data/exercises";
import { GoalForm } from "@/components/goals/GoalForm";
import { postJson } from "@/lib/api-client";
import { isAdmin } from "@/lib/admin";
import type { Exercise, Goal, GymSettings, Sex, UserProfile } from "@/types";

const EQUIPMENT_OPTIONS = ["바벨", "덤벨", "머신", "케이블", "맨몸"];

export default function AdminPage() {
  const { user, signOutUser } = useAuth();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [gymSettings, setGymSettings] = useState<GymSettings>({ equipment: [], favoriteExerciseIds: [] });
  const [profileForm, setProfileForm] = useState({ birthYear: "", heightCm: "", sex: null as Sex | null });
  const [profileSaved, setProfileSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goalSaved, setGoalSaved] = useState(false);
  const [seedingFoods, setSeedingFoods] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [sharedExercises, setSharedExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!user) return;
    getSharedExercises()
      .then(setSharedExercises)
      .catch((err) => console.error("failed to load shared exercises", err));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    Promise.all([getGoal(user.uid), getGymSettings(user.uid), getUserProfile(user.uid)])
      .then(([g, gym, p]) => {
        if (ignore) return;
        setGoal(g);
        setGymSettings(gym);
        setProfileForm({
          birthYear: p.birthYear?.toString() ?? "",
          heightCm: p.heightCm?.toString() ?? "",
          sex: p.sex ?? null,
        });
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  async function handleProfileSave() {
    if (!user) return;
    const next: UserProfile = {
      birthYear: profileForm.birthYear ? Number(profileForm.birthYear) : undefined,
      heightCm: profileForm.heightCm ? Number(profileForm.heightCm) : undefined,
      sex: profileForm.sex ?? undefined,
    };
    await saveUserProfile(user.uid, next);
    setProfileSaved(true);
  }

  async function handleGoalSubmit(g: Omit<Goal, "updatedAt">) {
    if (!user) return;
    await saveGoal(user.uid, g);
    setGoal({ ...g, updatedAt: new Date().toISOString() });
    setGoalSaved(true);
  }

  async function toggleEquipment(name: string) {
    if (!user) return;
    const next: GymSettings = {
      ...gymSettings,
      equipment: gymSettings.equipment.includes(name)
        ? gymSettings.equipment.filter((e) => e !== name)
        : [...gymSettings.equipment, name],
    };
    setGymSettings(next);
    await saveGymSettings(user.uid, next);
  }

  async function unfavorite(exerciseId: string) {
    if (!user) return;
    const next = await toggleFavoriteExercise(user.uid, exerciseId);
    setGymSettings(next);
  }

  async function handleRestartOnboarding() {
    if (!user) return;
    await restartOnboarding(user.uid);
    router.push("/onboarding");
  }

  async function handleSeedChainMenu() {
    if (!user) return;
    setSeedingFoods(true);
    setSeedResult(null);
    try {
      const token = await user.getIdToken();
      const data = await postJson<{ added: number; skipped: number }>(
        "/api/food/seed-chain-menu",
        token,
        {}
      );
      setSeedResult(`${data.added}개 추가, ${data.skipped}개는 이미 있어서 건너뜀`);
    } catch (err) {
      setSeedResult(err instanceof Error ? err.message : "등록에 실패했어요.");
    } finally {
      setSeedingFoods(false);
    }
  }

  const canManageSharedData = isAdmin(user?.uid);

  const favoriteExercises = gymSettings.favoriteExerciseIds
    .map((id) => getExerciseById(id) ?? sharedExercises.find((e) => e.id === id))
    .filter((ex): ex is NonNullable<typeof ex> => !!ex);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-xl font-bold text-ink">관리 메뉴</div>
        <p className="mt-0.5 text-[13px] text-muted">목표와 환경설정을 관리해요.</p>
      </div>

      <section className="flex flex-col gap-3.5 rounded-2xl border border-card-border bg-white p-4">
        <div className="text-[13px] font-bold text-ink">기본 정보</div>
        <p className="text-xs text-muted">칼로리 계산에 쓰이는 정보예요. 값이 바뀌면 관리 메뉴에서 목표를 다시 계산해 저장해주세요.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-1.5 text-xs font-semibold text-muted-dark">출생년도</div>
            <input
              value={profileForm.birthYear}
              onChange={(e) => setProfileForm((p) => ({ ...p, birthYear: e.target.value }))}
              inputMode="numeric"
              placeholder="예: 1998"
              className="w-full rounded-[10px] border border-input-border bg-ivory px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-muted-dark">키 (cm)</div>
            <input
              value={profileForm.heightCm}
              onChange={(e) => setProfileForm((p) => ({ ...p, heightCm: e.target.value }))}
              inputMode="decimal"
              placeholder="예: 172"
              className="w-full rounded-[10px] border border-input-border bg-ivory px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-xs font-semibold text-muted-dark">성별</div>
          <div className="flex gap-2">
            {(["male", "female"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setProfileForm((p) => ({ ...p, sex: s }))}
                className="flex-1 rounded-xl border py-2.5 text-center text-[13px] font-bold"
                style={{
                  borderColor: profileForm.sex === s ? "var(--color-brand)" : "var(--color-input-border)",
                  background: profileForm.sex === s ? "var(--color-brand)" : "#fff",
                  color: profileForm.sex === s ? "#fff" : "var(--color-ink)",
                }}
              >
                {s === "male" ? "남성" : "여성"}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleProfileSave}
          className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-bold text-white"
        >
          기본 정보 저장
        </button>
        {profileSaved && <p className="text-center text-xs font-semibold text-brand">저장했어요!</p>}
      </section>

      <section className="flex flex-col gap-3.5 rounded-2xl border border-card-border bg-white p-4">
        <div className="text-[13px] font-bold text-ink">목표 설정</div>
        {loading ? (
          <p className="text-sm text-muted">불러오는 중...</p>
        ) : (
          <GoalForm initialGoal={goal} submitLabel="목표 저장" onSubmit={handleGoalSubmit} />
        )}
        {goalSaved && <p className="text-center text-xs font-semibold text-brand">저장했어요!</p>}
      </section>

      <section className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-white p-4">
        <div className="text-[13px] font-bold text-ink">헬스장 보유 기구</div>
        <p className="text-xs text-muted">선택한 기구를 기준으로 운동 목록을 추천해드려요.</p>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((eq) => {
            const active = gymSettings.equipment.includes(eq);
            return (
              <button
                key={eq}
                onClick={() => toggleEquipment(eq)}
                className="rounded-full px-4 py-2.5 text-xs font-bold"
                style={{
                  border: `1px solid ${active ? "var(--color-brand)" : "var(--color-input-border)"}`,
                  background: active ? "var(--color-brand)" : "#fff",
                  color: active ? "#fff" : "var(--color-ink)",
                }}
              >
                {eq}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-white p-4">
        <div className="text-[13px] font-bold text-ink">즐겨찾기 운동</div>
        {favoriteExercises.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {favoriteExercises.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between border-b border-divider py-2">
                <div className="text-[13px] text-ink">{ex.nameKo}</div>
                <button onClick={() => unfavorite(ex.id)} className="text-brand">
                  ★
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">운동 화면에서 ★을 눌러 즐겨찾기에 추가해보세요.</p>
        )}
      </section>

      {canManageSharedData && (
        <section className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-white p-4">
          <div className="text-[13px] font-bold text-ink">공통 음식 DB: 프랜차이즈 메뉴 등록</div>
          <p className="text-xs text-muted">
            제공해준 영양성분표 기준 맥도날드/버거킹 메뉴를 공통 음식 DB에 등록해요. 이미 등록된 항목은 건너뛰어서 여러 번 눌러도 안전해요.
            (표에 총 탄수화물/지방 수치가 없어서 두 값은 0으로 등록돼요.)
          </p>
          <button
            onClick={handleSeedChainMenu}
            disabled={seedingFoods}
            className="rounded-[10px] bg-brand py-2.5 text-center text-[13px] font-bold text-white disabled:opacity-50"
          >
            {seedingFoods ? "등록 중..." : "프랜차이즈 메뉴 등록하기"}
          </button>
          {seedResult && <p className="text-center text-xs font-semibold text-brand">{seedResult}</p>}
        </section>
      )}

      <button
        onClick={handleRestartOnboarding}
        className="text-center text-xs font-semibold text-muted underline"
      >
        온보딩 다시 보기
      </button>

      <button
        onClick={() => signOutUser().then(() => router.replace("/login"))}
        className="text-center text-xs font-semibold text-muted underline"
      >
        로그아웃
      </button>
    </div>
  );
}
