export function VersionDiff() {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-[#2a2118]">
          Changes from previous version
        </h3>
        <p className="mt-1 text-[#7b6f63]">
          Added text is highlighted in green. Removed text is highlighted in red.
        </p>
      </div>

      <div className="rounded-2xl bg-[#fbf3e8] p-5 leading-8 text-[#2a2118]">
        The project should launch before{" "}
        <span className="rounded bg-[#ffd9d5] px-1 line-through">
          next month
        </span>{" "}
        <span className="rounded bg-[#dcebd6] px-1">
          the confirmed campaign date
        </span>
        , and the team should prioritize{" "}
        <span className="rounded bg-[#dcebd6] px-1">
          mobile-first checkout screens
        </span>
        .
      </div>
    </div>
  );
}