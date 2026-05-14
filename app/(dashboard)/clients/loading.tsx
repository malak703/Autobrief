export default function ClientsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-4 w-20 rounded-full bg-[#e8dccd]" />
          <div className="mt-2 h-9 w-40 rounded-xl bg-[#e8dccd]" />
        </div>
        <div className="h-11 w-32 rounded-full bg-[#e8dccd]" />
      </div>

      <div className="mb-6 h-12 w-full rounded-2xl bg-[#e8dccd]" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card p-6">
            <div className="mb-8 flex items-center justify-between">
              <div className="h-14 w-14 rounded-full bg-[#e8dccd]" />
              <div className="h-6 w-16 rounded-full bg-[#e8dccd]" />
            </div>
            <div className="h-7 w-40 rounded bg-[#e8dccd]" />
            <div className="mt-2 h-4 w-48 rounded bg-[#e8dccd]" />
            <div className="mt-8 flex justify-between">
              <div className="h-4 w-24 rounded bg-[#e8dccd]" />
              <div className="h-4 w-20 rounded bg-[#e8dccd]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
