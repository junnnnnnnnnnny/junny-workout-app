import { MEAL_TYPES } from "@/lib/meal-types";
import type { DietLog } from "@/types";

export function DietDiaryEntries({
  entries,
  onEdit,
  onDelete,
}: {
  entries: DietLog[];
  onEdit: (entry: DietLog) => void;
  onDelete: (entry: DietLog) => void;
}) {
  const sections = MEAL_TYPES.map((mt) => ({
    ...mt,
    items: entries.filter((e) => e.mealType === mt.key),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[13px] font-bold text-muted-dark">이 날의 기록 ({entries.length})</div>
      {sections.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {sections.map((sec) => (
            <div key={sec.key} className="flex flex-col gap-2">
              <div className="text-xs font-bold text-muted">{sec.label}</div>
              {sec.items.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between rounded-2xl border border-card-border bg-white p-3.5"
                >
                  <div>
                    <div className="text-[13px] text-muted-dark">{log.rawInput}</div>
                    <div className="mt-1.5 text-xs font-semibold text-muted">
                      {Math.round(log.totalCalories)}kcal · 단백질 {Math.round(log.totalProteinG)}g · 탄{" "}
                      {Math.round(log.totalCarbsG)}g · 지방 {Math.round(log.totalFatG)}g
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <button onClick={() => onEdit(log)} className="text-xs font-bold text-brand">
                      수정
                    </button>
                    <button onClick={() => onDelete(log)} className="text-xs font-bold text-danger">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-card-border bg-white px-4 py-4 text-center text-xs text-muted">
          이 날의 식단 기록이 없어요.
        </div>
      )}
    </div>
  );
}
