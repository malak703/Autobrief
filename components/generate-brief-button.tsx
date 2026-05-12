"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GenerateBriefButtonProps {
  meetingId: string;
  hasBrief: boolean;
}

export default function GenerateBriefButton({ meetingId, hasBrief }: GenerateBriefButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  async function handleGenerateBrief() {
    if (hasBrief) {
      if (!confirm("This meeting already has a brief. Do you want to generate a new one?")) {
        return;
      }
    }

    setLoading(true);
    setProgress("Starting brief generation...");

    try {
      // Set up progress simulation
      const progressSteps = [
        "Processing meeting transcript...",
        "Analyzing content with AI...",
        "Generating project brief...",
        "Finalizing brief..."
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setProgress(progressSteps[stepIndex]);
          stepIndex++;
        } else {
          clearInterval(progressInterval);
        }
      }, 15000); // Update every 15 seconds

      const res = await fetch(`/api/meetings/${meetingId}/generate-brief`, {
        method: "POST",
      });

      clearInterval(progressInterval);
      setProgress("Finalizing...");

      const data = await res.json();

      if (res.ok && data.briefId) {
        setProgress("Brief generated successfully!");
        setTimeout(() => {
          router.push(`/briefs/${data.briefId}`);
        }, 1000);
      } else {
        setProgress("");
        alert(data.error || "Failed to generate brief.");
      }
    } catch (error) {
      setProgress("");
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleGenerateBrief}
        disabled={loading}
        className="rounded-xl bg-[var(--color-primary)] px-5 py-3 font-semibold text-white hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
      >
        {loading ? "Processing..." : hasBrief ? "Regenerate Brief" : "Generate Brief"}
      </button>
      
      {loading && progress && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-primary)]"></div>
            <p className="text-sm text-[var(--color-text-secondary)]">{progress}</p>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            This may take 1-3 minutes depending on the audio length. Please keep this page open.
          </p>
        </div>
      )}
    </div>
  );
}
