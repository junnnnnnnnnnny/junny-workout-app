export function ComingSoon({
  emoji,
  title,
  description,
  planned,
}: {
  emoji: string;
  title: string;
  description: string;
  planned: string[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
        <span className="text-4xl">{emoji}</span>
        <p className="text-sm font-medium text-neutral-600">준비 중이에요</p>
        <ul className="mt-2 flex flex-col gap-1 text-xs text-neutral-400">
          {planned.map((p) => (
            <li key={p}>· {p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
