import Link from "next/link";
import {
  Building2,
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Settings,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/briefs", label: "Briefs", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 border-r border-[#e8dccd] bg-[#fffaf2] px-5 py-6">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5b3f2a] text-white">
            <FileText size={22} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#2a2118]">AutoBrief</h1>
            <p className="text-sm text-[#7b6f63]">Agency intake system</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {nav.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[#5f5246] transition hover:bg-[#f6efe4] hover:text-[#2a2118]"
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}