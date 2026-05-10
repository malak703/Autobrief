export function CompletionMeter({
  value,
  missing,
}: {
  value: number;
  missing: string[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-[#5f5246]">Brief completeness</span>
        <span className="font-bold text-[#2a2118]">{value}%</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-[#efe3d4]">
        <div
          className="h-full rounded-full bg-[#5b3f2a]"
          style={{ width: `${value}%` }}
        />
      </div>

      {missing.length > 0 && (
        <p className="mt-3 text-sm text-[#7b6f63]">
          Missing: {missing.join(", ")}
        </p>
      )}
    </div>
  );
}