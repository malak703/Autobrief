import {
  Bell,
  Building2,
  Database,
  KeyRound,
  Mail,
  Palette,
  Shield,
  UserRound,
} from "lucide-react";

const settingsSections = [
  {
    title: "Company profile",
    description: "Manage company name, workspace details, and default branding.",
    icon: Building2,
    items: ["Company name", "Workspace URL", "Default client link branding"],
  },
  {
    title: "Team permissions",
    description: "Control what admins and employees can view or edit.",
    icon: Shield,
    items: ["Admin access", "Employee access", "Client public access"],
  },
  {
    title: "AI processing",
    description: "Configure filtering, structuring, and anti-hallucination rules.",
    icon: Database,
    items: ["Stage 1 noise filtering", "Stage 2 brief structure", "Gap detection"],
  },
  {
    title: "Email & client links",
    description: "Manage how client confirmation links are shared.",
    icon: Mail,
    items: ["Resend email sender", "Client link expiry", "Reminder emails"],
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Settings
        </p>

        <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#2a2118]">
          Workspace settings
        </h1>

        <p className="mt-3 max-w-2xl text-lg text-[#7b6f63]">
          Manage company settings, team permissions, AI behavior, client links,
          and integrations.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
              <UserRound size={26} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#2a2118]">
                Account details
              </h2>
              <p className="text-[#7b6f63]">
                Basic profile information for the current user.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                Full name
              </label>
              <input
                defaultValue="Team Member"
                className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                Email address
              </label>
              <input
                defaultValue="employee@example.com"
                className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                Role
              </label>
              <select className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none">
                <option>Admin</option>
                <option>Employee</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                Company
              </label>
              <input
                defaultValue="Northline Studio"
                className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="btn-primary">Save account</button>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
            <Palette size={26} />
          </div>

          <h2 className="text-2xl font-bold text-[#2a2118]">
            Appearance
          </h2>

          <p className="mt-2 text-[#7b6f63]">
            Current theme is warm beige minimal. This keeps the app calm,
            professional, and easy to scan.
          </p>

          <div className="mt-6 grid grid-cols-4 gap-3">
            <div className="h-12 rounded-2xl bg-[#f6efe4]" />
            <div className="h-12 rounded-2xl bg-[#fffaf2]" />
            <div className="h-12 rounded-2xl bg-[#5b3f2a]" />
            <div className="h-12 rounded-2xl bg-[#c99a4a]" />
          </div>

          <button className="btn-secondary mt-6 w-full">
            Customize theme
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          return (
            <div key={section.title} className="card p-6">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
                  <Icon size={23} />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-[#2a2118]">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-[#7b6f63]">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {section.items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl border border-[#e8dccd] bg-[#fbf3e8] px-4 py-3"
                  >
                    <span className="font-medium text-[#5f5246]">{item}</span>
                    <button className="text-sm font-semibold text-[#5b3f2a]">
                      Configure
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
              <KeyRound size={23} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#2a2118]">
                API keys
              </h2>
              <p className="text-[#7b6f63]">
                Connect Gemini, Groq, Supabase, and Resend.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {["Gemini API Key", "Groq API Key", "Supabase URL", "Resend API Key"].map(
              (keyName) => (
                <div key={keyName}>
                  <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                    {keyName}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none"
                  />
                </div>
              )
            )}
          </div>

          <button className="btn-primary mt-6">Save integrations</button>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
              <Bell size={23} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#2a2118]">
                Notifications
              </h2>
              <p className="text-[#7b6f63]">
                Choose when employees are notified.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              "Client requests edits",
              "Client accepts all sections",
              "Brief reaches 100% completeness",
              "AI extracts a deadline",
              "New proposal version is created",
            ].map((item) => (
              <label
                key={item}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#e8dccd] bg-[#fbf3e8] px-4 py-4"
              >
                <span className="font-medium text-[#5f5246]">{item}</span>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </label>
            ))}
          </div>

          <button className="btn-primary mt-6">Save notifications</button>
        </div>
      </div>
    </div>
  );
}