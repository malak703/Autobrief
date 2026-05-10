export function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="card p-6">
      <p className="text-sm font-medium text-[#7b6f63]">{label}</p>
      <p className="mt-3 text-4xl font-bold text-[#2a2118]">{value}</p>
    </div>
  );
}