export default function CalendarLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-4 w-20 rounded-full bg-[#e8dccd]" />
          <div className="mt-2 h-9 w-36 rounded-xl bg-[#e8dccd]" />
        </div>
        <div className="h-11 w-36 rounded-full bg-[#e8dccd]" />
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-8 w-40 rounded bg-[#e8dccd]" />
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-full bg-[#e8dccd]" />
            <div className="h-9 w-9 rounded-full bg-[#e8dccd]" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`h-${i}`} className="h-8 rounded bg-[#e8dccd]" />
          ))}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-[#f6efe4]" />
          ))}
        </div>
      </div>
    </div>
  );
}
