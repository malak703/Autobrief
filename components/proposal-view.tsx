"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { SectionCard } from "@/components/section-card";
import type { BriefSection } from "@/lib/types";

export function ProposalView({
  proposal,
  sections,
  briefId,
}: {
  proposal: string;
  sections: BriefSection[];
  briefId: string;
}) {
  const [showSections, setShowSections] = useState(false);

  return (
    <div>
      {/* Toggle between proposal and sections */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2a2118]">
            {showSections ? "Brief Sections" : "Final Proposal"}
          </h2>
          <p className="mt-1 text-sm text-[#7b6f63]">
            {showSections
              ? "Viewing the original brief sections."
              : "The client has generated and confirmed this proposal."}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowSections(!showSections)}
        >
          {showSections ? "View Proposal" : "View Sections"}
        </button>
      </div>

      {showSections ? (
        <div className="space-y-5">
          {sections.map((section) => (
            <SectionCard key={section.id} briefId={briefId} section={section} />
          ))}
        </div>
      ) : (
        <div className="card p-8">
          <div className="bg-white rounded-lg p-8 border border-[#e8dccd]">
            <div className="prose prose-lg prose-brown max-w-none">
              <ReactMarkdown>{proposal}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
