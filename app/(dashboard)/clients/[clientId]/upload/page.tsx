import { EnhancedUploadArea } from "@/components/enhanced-upload-area";
import { createServerSupabase } from "@/lib/supabase";

export default async function UploadForClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createServerSupabase();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) {
    return <p>Client not found.</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Upload intake material
        </p>
        <h1 className="mt-2 text-5xl font-bold text-[#2a2118]">
          New brief for {client.name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-[#7b6f63]">
          Upload multiple types of content in organized sections. Each section handles specific file types and processes them automatically. This upload is attached only to this client.
        </p>
      </div>

      <EnhancedUploadArea clientId={client.id} />

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-xl font-bold">1. Filter</p>
          <p className="mt-2 text-[#7b6f63]">
            AI removes jokes, greetings, filler words, and personal talk.
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xl font-bold">2. Structure</p>
          <p className="mt-2 text-[#7b6f63]">
            The signal becomes a 4-section brief with gaps clearly marked.
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xl font-bold">3. Review</p>
          <p className="mt-2 text-[#7b6f63]">
            Employee edits, approves, then sends a unique client link.
          </p>
        </div>
      </div>
    </div>
  );
}
