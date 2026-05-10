import { Mic } from "lucide-react";

export function VoiceFeedback() {
  return (
    <div className="mt-4 rounded-2xl border border-[#e8dccd] bg-[#fbf3e8] p-4">
      <button className="flex items-center gap-2 rounded-full bg-[#5b3f2a] px-4 py-2 font-semibold text-white">
        <Mic size={18} />
        Record voice feedback
      </button>

      <p className="mt-3 text-sm text-[#7b6f63]">
        The voice note will be transcribed and attached to this section.
      </p>
    </div>
  );
}