"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { SectionCard } from "@/components/section-card";
import type { BriefSection } from "@/lib/types";

function ReferenceImages({ imageUrls }: { imageUrls: string[] }) {
  if (!imageUrls || imageUrls.length === 0) return null;
  return (
    <div className="card mt-8 p-6">
      <h3 className="mb-4 text-lg font-bold text-[#2a2118]">
        📎 Reference Images ({imageUrls.length})
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {imageUrls.map((url, idx) => (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group overflow-hidden rounded-xl border border-[#e8dccd] bg-[#f8f4ed] transition-shadow hover:shadow-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Reference ${idx + 1}`}
              className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
            />
            <p className="border-t border-[#e8dccd] px-2 py-1.5 text-center text-xs text-[#7b6f63]">
              Image {idx + 1}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}

export function ProposalView({
  proposal,
  sections,
  briefId,
  imageUrls = [],
}: {
  proposal: string;
  sections: BriefSection[];
  briefId: string;
  imageUrls?: string[];
}) {
  const [showSections, setShowSections] = useState(false);
  const proposalRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (typeof window === "undefined" || !proposalRef.current) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: 10,
        filename: "project-proposal.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as const;
      html2pdf().set(opt).from(proposalRef.current).save();
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div>
      {/* Toggle between proposal and sections */}
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#2a2118] md:text-2xl">
            {showSections ? "Brief Sections" : "Final Proposal"}
          </h2>
          <p className="mt-1 text-sm text-[#7b6f63] md:text-base">
            {showSections
              ? "Viewing the original brief sections."
              : "The client has generated and confirmed this proposal."}
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary w-full sm:w-auto"
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
        <div className="card p-4 sm:p-8">
          <div
            className="bg-white rounded-lg p-4 sm:p-8 border border-[#e8dccd] overflow-x-auto"
            ref={proposalRef}
          >
            <div className="prose sm:prose-lg prose-brown max-w-none break-words">
              <ReactMarkdown>{proposal}</ReactMarkdown>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                navigator.clipboard.writeText(proposal);
                alert("Proposal copied to clipboard!");
              }}
            >
              Copy Proposal
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownloadPdf}
            >
              Download PDF
            </button>
          </div>
        </div>
      )}

      <ReferenceImages imageUrls={imageUrls} />
    </div>
  );
}
