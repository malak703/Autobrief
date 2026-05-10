import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Sidebar />

      <main className="ml-72 min-h-screen px-10 py-8">
        {children}
      </main>
    </div>
  );
}