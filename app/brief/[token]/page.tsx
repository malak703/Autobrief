"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { getBriefByToken } from "@/app/actions/get-brief";
import { computeWordDiff, hasChanges } from "@/lib/word-diff";
import { splitFollowupQuestionsField } from "@/lib/brief-helpers";
import { GenerationOverlay } from "@/components/generation-overlay";

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

export default function PublicBriefPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [brief, setBrief] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proposalProgress, setProposalProgress] = useState("");
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [finalProposal, setFinalProposal] = useState<string>("");
  const [showProposal, setShowProposal] = useState<boolean>(false);
  const proposalRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (typeof window === "undefined" || !proposalRef.current) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       10,
        filename:     'project-proposal.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as const;
      html2pdf().set(opt).from(proposalRef.current).save();
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  // Load token and brief data
  useEffect(() => {
    const loadData = async () => {
      const { token: resolvedToken } = await params;
      setToken(resolvedToken);
      
      const result = await getBriefByToken(resolvedToken);
      
      if (!result.success || !result.data) {
        setLoading(false);
        return;
      }
      
      setBrief(result.data.brief as any);
      setSections(result.data.sections);

      // If a final proposal was already generated, show it immediately
      const savedProposal = (result.data.brief as any)?.final_proposal;
      if (savedProposal) {
        setFinalProposal(savedProposal);
        setShowProposal(true);
      }

      setLoading(false);
    };
    
    loadData();
  }, [params]);

  const handleSubmitFeedback = async () => {
    setSubmitting(true);
    
    try {
      // Get all follow-up answers
      const followupAnswers: Record<string, string> = {};
      document.querySelectorAll('textarea[name^="followup-"]').forEach((textarea) => {
        const name = (textarea as HTMLTextAreaElement).name;
        const value = (textarea as HTMLTextAreaElement).value;
        followupAnswers[name] = value;
      });
      
      // Get other feedback
      const feedbackTextareas = document.querySelectorAll('textarea:not([name^="followup-"])');
      const feedback: Record<string, string> = {};
      feedbackTextareas.forEach((textarea) => {
        const value = (textarea as HTMLTextAreaElement).value;
        if (value.trim()) {
          feedback['general'] = value;
        }
      });
      
      const response = await fetch('/api/brief-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          followupAnswers,
          feedback,
        }),
      });
      
      if (response.ok) {
        alert('Feedback submitted successfully!');
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateProposal = async () => {
    setSubmitting(true);
    setProposalProgress("Preparing your brief data...");
    
    try {
      // Collect all data from the page
      const pageData: any = {
        sections: sections.map(section => ({
          ...section,
          content: editedContent[section.id] || section.content
        })),
        followupAnswers: {},
        additionalComments: ''
      };

      // Get follow-up answers
      document.querySelectorAll('textarea[name^="followup-"]').forEach((textarea) => {
        const name = (textarea as HTMLTextAreaElement).name;
        const value = (textarea as HTMLTextAreaElement).value;
        pageData.followupAnswers[name] = value;
      });
      
      // Get additional comments
      const commentsTextarea = document.querySelector('textarea[name="additional-comments"]') as HTMLTextAreaElement;
      if (commentsTextarea) {
        pageData.additionalComments = commentsTextarea.value;
      }

      // Call API to generate final proposal
      console.log('Sending data to generate proposal:', pageData);
      setProposalProgress("Generating your proposal with AI...");

      // Progress steps simulation
      const steps = [
        "Analyzing brief sections...",
        "Crafting proposal structure...",
        "Finalizing proposal..."
      ];
      let stepIdx = 0;
      const progressTimer = setInterval(() => {
        if (stepIdx < steps.length) {
          setProposalProgress(steps[stepIdx]);
          stepIdx++;
        } else {
          clearInterval(progressTimer);
        }
      }, 8000);
      
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageData,
          token
        }),
      });

      clearInterval(progressTimer);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Proposal generation successful:', result);
        setFinalProposal(result.proposal);
        setShowProposal(true);
      } else {
        const errorText = await response.text();
        console.error('Proposal generation failed:', response.status, errorText);
        alert(`Failed to generate proposal (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6efe4] px-5 py-10">
        <div className="mx-auto max-w-4xl brief-loading-skeleton">
          <div className="generation-spinner">
            <div className="generation-spinner-ring" />
            <div className="generation-spinner-ring generation-spinner-ring-delay" />
            <div className="generation-spinner-dot" />
          </div>
          <p className="text-[#7b6f63] text-lg font-medium">Loading brief...</p>
          <div className="w-full max-w-md space-y-3">
            <div className="skeleton-pulse h-4 w-full" />
            <div className="skeleton-pulse h-4 w-3/4" />
            <div className="skeleton-pulse h-4 w-1/2" />
          </div>
        </div>
      </main>
    );
  }

  if (!brief) {
    return (
      <main className="min-h-screen bg-[#f6efe4] px-5 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-[#2a2118]">Brief not found</h1>
          <p className="mt-2 text-[#7b6f63]">
            This link may be invalid or the brief was removed.
          </p>
        </div>
      </main>
    );
  }

  const headline = brief?.content ? brief.content.split('\n')[0] : "Project Brief";

  // If a final proposal exists, show ONLY the proposal view
  if (showProposal && finalProposal) {
    return (
      <main className="min-h-screen bg-[#f6efe4] px-3 py-6 sm:px-5 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="card mb-6 p-5 text-center sm:mb-8 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7b52] sm:text-sm">
              Final proposal
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight text-[#2a2118] sm:text-4xl md:text-5xl">
              {headline}
            </h1>
          </div>

          <div className="card p-4 sm:p-8">
            <h2 className="text-xl font-bold text-[#2a2118] mb-4 sm:text-3xl sm:mb-6">
              Final Project Proposal
            </h2>
            <div className="bg-white rounded-lg p-4 sm:p-8 border border-[#e8dccd] overflow-x-auto" ref={proposalRef}>
              <div className="prose prose-sm sm:prose-lg prose-brown max-w-none break-words">
                <ReactMarkdown>
                  {finalProposal}
                </ReactMarkdown>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowProposal(false)}
              >
                Back to Edit
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => {
                  navigator.clipboard.writeText(finalProposal);
                  alert('Proposal copied to clipboard!');
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
          
          <ReferenceImages imageUrls={brief?.image_urls || []} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6efe4] px-3 py-6 sm:px-5 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="card mb-6 p-5 text-center sm:mb-8 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7b52] sm:text-sm">
            Client confirmation
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-[#2a2118] sm:text-4xl md:text-5xl">
            {headline}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#7b6f63] sm:mt-4 sm:text-lg">
            Please review each section. Mark it as correct or request a change.
            You can type feedback or record a voice note.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {sections.map((section: any) => {
            if (section.id === "followup") {
              const content = section.content || "";
              
              // Use the proper question parser
              const { questions } = splitFollowupQuestionsField(content);

              if (questions.length === 0) {
                return (
                  <div key={section.id} className="card p-4 sm:p-6">
                    <h2 className="text-lg font-bold text-[#2a2118] sm:text-2xl">
                      {section.title}
                    </h2>
                    <p className="mt-4 leading-8 text-[#5f5246] whitespace-pre-wrap">
                      {section.content || "—"}
                    </p>
                  </div>
                );
              }

              return (
                <div key={section.id} className="space-y-5">
                  <h2 className="text-2xl font-bold text-[#2a2118] px-2">
                    {section.title}
                  </h2>
                  {questions.map((q: string, idx: number) => (
                    <div key={idx} className="card p-6">
                      <p className="text-lg font-semibold leading-relaxed text-[#2a2118]">
                        {q}
                      </p>
                      <label className="mt-4 block text-sm font-medium text-[#5f5246]">
                        Your answer
                        <textarea
                          name={`followup-${idx}`}
                          placeholder="Type your answer here..."
                          className="mt-2 min-h-24 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-base text-[#2a2118] outline-none"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div key={section.id} className="card p-4 sm:p-6">
                <h2 className="text-lg font-bold text-[#2a2118] sm:text-2xl">
                  {section.title}
                </h2>

                {editingSections.has(section.id) ? (
                  <div>
                    <textarea
                      value={editedContent[section.id] || section.content || ""}
                      onChange={(e) => setEditedContent(prev => ({
                        ...prev,
                        [section.id]: e.target.value
                      }))}
                      placeholder="Edit this section..."
                      className="mt-4 min-h-28 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-base text-[#2a2118] outline-none resize-none"
                    />
                    <div className="mt-4 flex gap-3">
                      <button 
                        type="button" 
                        className="btn-primary"
                        onClick={() => {
                          setEditingSections(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(section.id);
                            return newSet;
                          });
                          // Update the brief content with edited content
                          if (editedContent[section.id]) {
                            setBrief((prev: any) => ({
                              ...prev,
                              content: prev.content ? 
                                prev.content.replace(
                                  new RegExp(`### ${section.title}[^]*`, 'm'),
                                  `### ${section.title}\n${editedContent[section.id]}`
                                ) : 
                                prev.content
                            }));
                          }
                        }}
                      >
                        ✓ Save changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="mt-4 leading-8 text-[#5f5246] whitespace-pre-wrap">
                      {editedContent[section.id] || section.content || "—"}</p>

                    {/* Show diff when client has edited this section */}
                    {editedContent[section.id] && section.content && hasChanges(section.content, editedContent[section.id]) && (
                      <div className="mt-4 rounded-2xl border border-[#e8dccd] bg-[#fbf3e8] p-5">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#9a7b52]">
                          Your changes
                        </p>
                        <div className="leading-8 text-[#2a2118]">
                          {computeWordDiff(section.content, editedContent[section.id]).map((seg, i) => {
                            if (seg.type === "removed") {
                              return (
                                <span key={i} className="rounded bg-[#ffd9d5] px-1 line-through">
                                  {seg.text}
                                </span>
                              );
                            }
                            if (seg.type === "added") {
                              return (
                                <span key={i} className="rounded bg-[#dcebd6] px-1">
                                  {seg.text}
                                </span>
                              );
                            }
                            return <span key={i}>{seg.text}</span>;
                          })}
                        </div>
                      </div>
                    )}

                    {section.id !== "gaps" && (
                      <div className="mt-6">
                        <button 
                          type="button" 
                          className="btn-secondary"
                          onClick={() => {
                            setEditingSections(prev => new Set(prev).add(section.id));
                          }}
                        >
                          ✕ Edit this
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Comments Section */}
        <div className="card mt-6 p-4 sm:mt-8 sm:p-6">
          <h2 className="text-lg font-bold text-[#2a2118] mb-3 sm:text-2xl sm:mb-4">
            Additional Comments
          </h2>
          <p className="text-sm text-[#7b6f63] mb-4 sm:text-base sm:mb-6">
            Do you have any additional comments or feedback about this brief?
          </p>
          <textarea
            name="additional-comments"
            placeholder="Type any additional comments here..."
            className="min-h-32 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-base text-[#2a2118] outline-none resize-none"
          />
        </div>

        <div className="mt-6 flex justify-end sm:mt-8">
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={handleGenerateProposal} disabled={submitting}>
            Show Final Proposal
          </button>
        </div>

        {submitting && (
          <GenerationOverlay
            message={proposalProgress || "Generating proposal..."}
            subMessage="We're crafting your final proposal. This may take a moment."
          />
        )}

        <ReferenceImages imageUrls={brief?.image_urls || []} />
      </div>
    </main>
  );
}
