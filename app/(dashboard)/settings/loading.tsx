export default function SettingsLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-4 w-20 rounded-full bg-[#e8dccd]" />
        <div className="mt-2 h-9 w-32 rounded-xl bg-[#e8dccd]" />
      </div>

      <div className="card space-y-6 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-4 w-28 rounded bg-[#e8dccd]" />
            <div className="mt-2 h-12 w-full rounded-2xl bg-[#f6efe4]" />
          </div>
        ))}
        <div className="h-11 w-32 rounded-full bg-[#e8dccd]" />
      </div>
    </div>
  );
}
