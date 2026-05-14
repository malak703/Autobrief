export default function BriefsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-4 w-16 rounded-full bg-[#e8dccd]" />
        <div className="mt-2 h-9 w-32 rounded-xl bg-[#e8dccd]" />
      </div>

      <div className="mb-6 h-12 w-full rounded-2xl bg-[#e8dccd]" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card p-6">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex-1">
                <div className="h-6 w-48 rounded bg-[#e8dccd]" />
                <div className="mt-2 h-4 w-32 rounded bg-[#e8dccd]" />
              </div>
              <div className="h-6 w-16 rounded-full bg-[#e8dccd]" />
            </div>
            <div className="h-3 w-full rounded-full bg-[#e8dccd]" />
          </div>
        ))}
      </div>
    </div>
  );
}
