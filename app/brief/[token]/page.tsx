"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { getBriefByToken } from "@/app/actions/get-brief";

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
    
    try {
      // Collect all data from the page
      const pageData: any = {
        brief: brief,
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
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[#7b6f63]">Loading...</p>
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
      <main className="min-h-screen bg-[#f6efe4] px-5 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="card mb-8 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
              Final proposal
            </p>
            <h1 className="mt-2 text-4xl font-bold leading-tight text-[#2a2118] sm:text-5xl">
              {headline}
            </h1>
          </div>

          <div className="card p-8">
            <h2 className="text-3xl font-bold text-[#2a2118] mb-6">
              Final Project Proposal
            </h2>
            <div className="bg-white rounded-lg p-8 border border-[#e8dccd]" ref={proposalRef}>
              <div className="prose prose-lg prose-brown max-w-none">
                <ReactMarkdown>
                  {finalProposal}
                </ReactMarkdown>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6efe4] px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="card mb-8 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
            Client confirmation
          </p>
          <h1 className="mt-2 text-4xl font-bold leading-tight text-[#2a2118] sm:text-5xl">
            {headline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#7b6f63]">
            Please review each section. Mark it as correct or request a change.
            You can type feedback or record a voice note.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {sections.map((section: any) => {
            if (section.id === "followup") {
              const content = section.content || "";
              
              // Better question splitting logic
              const questions = content
                .split('\n')
                .map((q: string) => q.trim())
                .filter((q: string) => {
                  return q.length > 0 && 
                         !q.toLowerCase().startsWith("here are") &&
                         !q.toLowerCase().startsWith("follow-up") &&
                         !q.toLowerCase().startsWith("follow up") &&
                         !q.match(/^\d+\./) &&
                         !q.includes('@@@') &&
                         !q.includes('---') &&
                         q !== '---';
                });

              if (questions.length === 0) {
                return (
                  <div key={section.id} className="card p-6">
                    <h2 className="text-2xl font-bold text-[#2a2118]">
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
              <div key={section.id} className="card p-6">
                <h2 className="text-2xl font-bold text-[#2a2118]">
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
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Comments Section */}
        <div className="card mt-8 p-6">
          <h2 className="text-2xl font-bold text-[#2a2118] mb-4">
            Additional Comments
          </h2>
          <p className="text-[#7b6f63] mb-6">
            Do you have any additional comments or feedback about this brief?
          </p>
          <textarea
            name="additional-comments"
            placeholder="Type any additional comments here..."
            className="min-h-32 w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4 text-base text-[#2a2118] outline-none resize-none"
          />
        </div>

        <div className="mt-8 flex justify-end">
          <button type="button" className="btn-primary" onClick={handleGenerateProposal}>
            {submitting ? 'Generating...' : 'Show Final Proposal'}
          </button>
        </div>
      </div>
    </main>
  );
}
