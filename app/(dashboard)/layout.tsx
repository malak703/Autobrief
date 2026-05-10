import { Sidebar } from "@/components/sidebar";
import { syncBusinessOwnerFromAuth } from "@/lib/profile/sync-business-owner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await syncBusinessOwnerFromAuth();

  return (
    <div>
      <Sidebar />

      <main className="ml-72 min-h-screen px-10 py-8">
        {children}
      </main>
    </div>
  );
}