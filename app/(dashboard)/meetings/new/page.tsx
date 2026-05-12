"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const allowedTypes = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "video/mp4",
  "video/webm",
];

interface Client {
  id: string;
  name: string;
  company?: string;
}

export default function NewMeetingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setClientsLoading(false);
      }
    }

    fetchClients();
  }, []);

  async function handleUpload() {
  if (!title || !clientId || !file) {
    alert("Please select a client, add meeting title, and upload a file.");
    return;
  }

  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["mp3", "wav", "m4a", "mp4", "webm"];

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    alert("Please upload .mp3, .wav, .m4a, .mp4, or .webm only.");
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("clientId", clientId);
    formData.append("file", file);

    const res = await fetch("/api/meetings/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Upload failed:", data);
      alert(data.error || data.details || "Failed to process meeting.");
      return;
    }

    if (data.meetingId) {
      router.push(`/meetings/${data.meetingId}`);
    } else {
      alert("No meeting ID returned.");
    }
  } catch (error) {
    console.error("Unexpected upload error:", error);
    alert("Unexpected error while uploading meeting.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-6xl font-bold tracking-tight text-[var(--color-text)]">
          New client meeting
        </h1>

        <p className="mt-5 max-w-4xl text-xl leading-8 text-[var(--color-text-secondary)]">
          Upload a meeting recording or video. AutoBrief will transcribe it,
          generate a detailed meeting report, identify missing information,
          and suggest follow-up questions.
        </p>
      </div>

      <section className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="rounded-[2rem] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10">
          <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary)]">
            <span className="text-5xl">🎙️</span>
          </div>

            <h2 className="text-center text-4xl font-bold text-[var(--color-text)]">
              Upload meeting recording
            </h2>

            <p className="mx-auto mt-4 max-w-3xl text-center text-lg leading-8 text-[var(--color-text-secondary)]">
              Supported files: .mp3, .wav, .m4a, .mp4, .webm
            </p>

            <div className="mx-auto mt-10 max-w-3xl space-y-5">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={clientsLoading}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-lg text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="">
                  {clientsLoading ? "Loading clients..." : "Select a client"}
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.company && ` - ${client.company}`}
                  </option>
                ))}
              </select>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting title"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-lg text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              />

              <label className="block cursor-pointer rounded-[2rem] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-14 text-center hover:bg-[var(--color-accent)]">
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <div className="text-2xl font-bold text-[var(--color-text)]">
                  Choose meeting file
                </div>

                <p className="mt-3 text-[var(--color-text-secondary)]">
                  {file ? file.name : "No file selected yet"}
                </p>
              </label>

              <div className="flex justify-center">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="rounded-full bg-[var(--color-primary)] px-8 py-4 text-lg font-bold text-white hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
                >
                  {loading
                    ? "Transcribing and generating report..."
                    : "Generate meeting report"}
                </button>
              </div>

              {loading && (
                <p className="text-center text-[var(--color-text-secondary)]">
                  This may take a little time depending on the file length.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
  );
}