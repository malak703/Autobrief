import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
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
      <MobileNav />

      <main className="min-h-screen px-4 pb-6 pt-24 sm:px-6 md:pb-8 lg:ml-72 lg:px-10 lg:pt-8">
        {children}
      </main>
    </div>
  );
}