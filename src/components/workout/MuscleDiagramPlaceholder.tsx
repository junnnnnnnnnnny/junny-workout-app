export function MuscleDiagramPlaceholder({ muscleLabel }: { muscleLabel: string }) {
  return (
    <div
      className="flex h-[120px] items-center justify-center rounded-2xl"
      style={{
        background:
          "repeating-linear-gradient(135deg, #f1ede1, #f1ede1 8px, #e9e3d3 8px, #e9e3d3 16px)",
      }}
    >
      <div className="text-center font-mono text-[11px] leading-[1.6] text-muted">
        자극 부위 다이어그램
        <br />
        {muscleLabel}
      </div>
    </div>
  );
}
