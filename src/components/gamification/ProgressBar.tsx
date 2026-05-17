export function ProgressBar({
  value,
  label
}: {
  value: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      aria-label={label}
      className="h-3 w-full overflow-hidden rounded-full bg-midsea-foam"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-midsea-lagoon to-midsea-ocean transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
