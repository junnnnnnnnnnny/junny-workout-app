export function GoalBar({
  label,
  consumed,
  target,
  unit,
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
}) {
  const pct = Math.min(100, Math.round((consumed / target) * 100));
  const remaining = Math.max(0, Math.round(target - consumed));
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-neutral-500">
          {Math.round(consumed)} / {target} {unit}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        {remaining > 0 ? `${remaining}${unit} 남았어요` : "목표를 달성했어요"}
      </p>
    </div>
  );
}
