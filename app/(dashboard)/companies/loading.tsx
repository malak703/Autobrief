export default function CompaniesLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-4 w-24 rounded-full bg-[#e8dccd]" />
        <div className="mt-2 h-9 w-40 rounded-xl bg-[#e8dccd]" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6">
            <div className="h-6 w-48 rounded bg-[#e8dccd]" />
            <div className="mt-2 h-4 w-64 rounded bg-[#e8dccd]" />
          </div>
        ))}
      </div>
    </div>
  );
}
