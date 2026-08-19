interface MacroRow {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color: string;
}

export function MacroSummaryCard({ rows }: { rows: MacroRow[] }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-card-border bg-white p-4">
      {rows.map((row) => {
        const pct = row.target ? Math.min(100, Math.round((row.consumed / row.target) * 100)) : 0;
        return (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold text-ink">{row.label}</span>
              <span className="text-muted">
                {Math.round(row.consumed)} / {row.target}
                {row.unit}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
