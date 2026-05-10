import { BriefSection } from "@/lib/types";

export function SectionCard({ section }: { section: BriefSection }) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="text-2xl font-bold text-[#2a2118]">{section.title}</h3>

        <span className="rounded-full bg-[#f1e2cc] px-3 py-1 text-xs font-semibold text-[#5b3f2a]">
          {section.status.replace("_", " ")}
        </span>
      </div>

      <textarea
        defaultValue={section.content}
        className="min-h-32 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-[#2a2118] outline-none"
      />

      {section.clientComment && (
        <div className="mt-4 rounded-2xl border border-[#efc9c2] bg-[#fff1ef] p-4">
          <p className="text-sm font-bold text-[#9d574d]">Client comment</p>
          <p className="mt-1 text-[#7b6f63]">{section.clientComment}</p>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <button className="btn-secondary">Ask AI to rewrite</button>
        <button className="btn-primary">Save section</button>
      </div>
    </div>
  );
}