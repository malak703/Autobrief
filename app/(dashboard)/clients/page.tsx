import { AddClientForm } from "@/components/add-client-form";
import { ClientsSearchableList } from "@/components/clients-searchable-list";
import { createServerSupabase } from "@/lib/supabase";
import { syncBusinessOwnerFromAuth } from "@/lib/profile/sync-business-owner";

export default async function ClientsPage() {
  const supabase = await createServerSupabase();
  
  // Ensure business owner record exists for authenticated users
  await syncBusinessOwnerFromAuth();

  const { data: owner } = await supabase.from("business_owners").select("id").maybeSingle();

  const [clientsRes, briefsRes] = await Promise.all([
    owner?.id 
      ? supabase.from("clients").select("*").eq("owner_id", owner.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    owner?.id
      ? supabase.from("briefs").select("client_id").eq("owner_id", owner.id)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const clients = clientsRes.data;
  const clientsError = clientsRes.error;
  const briefLinks = briefsRes.data;
  const briefsCountError = briefsRes.error;

  const countByClient = new Map<string, number>();
  for (const row of briefLinks ?? []) {
    const cid = row.client_id as string;
    countByClient.set(cid, (countByClient.get(cid) ?? 0) + 1);
  }

  const rows = clients ?? [];
  const clientsWithBriefs = rows.map((client) => ({
    client,
    activeBriefs: countByClient.get(client.id) ?? 0,
  }));

  return (
    <div>
      {(clientsError || briefsCountError) && (
        <div className="card mb-6 border border-[#efc9c2] bg-[#fff1ef] p-4 text-sm text-[#9d574d]">
          <p className="font-semibold">Could not load data from Supabase</p>
          <p className="mt-1">
            {clientsError?.message ?? briefsCountError?.message}
          </p>
          <p className="mt-2 text-[#7b6f63]">
            Check that the <code className="rounded bg-[#efe3d4] px-1">clients</code> table exists, RLS allows
            access for <code className="rounded bg-[#efe3d4] px-1">auth.uid()</code>, and{" "}
            <code className="rounded bg-[#efe3d4] px-1">owner_id</code> references{" "}
            <code className="rounded bg-[#efe3d4] px-1">business_owners.id</code>.
          </p>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
            Clients
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#2a2118] md:text-5xl">
            Client library
          </h1>
          <p className="mt-3 text-base text-[#7b6f63] md:text-lg">
            Each client has their own page, uploads, proposals, versions, and comments.
          </p>
        </div>

        <AddClientForm />
      </div>

      {rows.length === 0 ? (
        <p className="text-[#7b6f63]">No clients yet.</p>
      ) : (
        <ClientsSearchableList items={clientsWithBriefs} />
      )}
    </div>
  );
}
