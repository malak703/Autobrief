export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-10">
        <div className="h-4 w-24 rounded-full bg-[#e8dccd]" />
        <div className="mt-3 h-10 w-72 rounded-2xl bg-[#e8dccd]" />
        <div className="mt-3 h-5 w-96 max-w-full rounded-full bg-[#e8dccd]" />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {[1, 2].map((i) => (
          <div key={i} className="card p-6">
            <div className="h-4 w-16 rounded bg-[#e8dccd]" />
            <div className="mt-2 h-8 w-12 rounded bg-[#e8dccd]" />
          </div>
        ))}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div className="h-7 w-40 rounded-xl bg-[#e8dccd]" />
        <div className="h-10 w-24 rounded-full bg-[#e8dccd]" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
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
