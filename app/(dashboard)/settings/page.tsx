import { KeyRound, Save, UserRound } from "lucide-react";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { createServerSupabase } from "@/lib/supabase/server";
import { updatePassword, updateUsername } from "@/app/actions/account";

type SettingsPageProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

type NotificationPreferences = {
  client_viewed_proposal: boolean;
  client_confirmed_proposal: boolean;
  client_edited_proposal: boolean;
  deadline_24h_left: boolean;
};

function NotificationSettingsCard({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  const items: Array<{
    key: keyof NotificationPreferences;
    label: string;
    description: string;
  }> = [
    {
      key: "client_viewed_proposal",
      label: "Client viewed proposal",
      description: "Receive updates when a client views a proposal.",
    },
    {
      key: "client_confirmed_proposal",
      label: "Client confirmed proposal",
      description: "Receive updates when a client confirms a proposal.",
    },
    {
      key: "client_edited_proposal",
      label: "Client edited proposal",
      description: "Receive updates when a client edits a proposal.",
    },
    {
      key: "deadline_24h_left",
      label: "24 hours until deadline",
      description: "Receive a reminder when a deadline is 24 hours away.",
    },
  ];

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
          N
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[#2a2118]">
            Notifications
          </h2>
          <p className="text-[#7b6f63]">
            Manage your notification preferences.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-[#e8dccd] bg-[#fffaf2] p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-[#2a2118]">{item.label}</p>
                <p className="text-sm text-[#7b6f63]">
                  {item.description}
                </p>
              </div>

              <span className="text-sm font-semibold text-[#2a2118]">
                {preferences[item.key] ? "On" : "Off"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Team Member";

  const defaultNotificationPreferences = {
    client_viewed_proposal: true,
    client_confirmed_proposal: true,
    client_edited_proposal: true,
    deadline_24h_left: true,
  };

  let notificationPreferences = defaultNotificationPreferences;

  if (user) {
    const { data } = await supabase
      .from("notification_preferences")
      .select(
        "client_viewed_proposal, client_confirmed_proposal, client_edited_proposal, deadline_24h_left"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    notificationPreferences = data ?? defaultNotificationPreferences;
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9a7b52]">
          Settings
        </p>

        <h1 className="mt-2 text-5xl font-bold tracking-tight text-[#2a2118]">
          Account settings
        </h1>

        <p className="mt-3 max-w-2xl text-lg text-[#7b6f63]">
          Manage your username, password, theme, and notifications.
        </p>
      </div>

      {searchParams?.success ? (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
          {searchParams.success}
        </div>
      ) : null}

      {searchParams?.error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {searchParams.error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="card p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
                <UserRound size={26} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#2a2118]">
                  Username
                </h2>
                <p className="text-[#7b6f63]">
                  This name appears in your sidebar and account area.
                </p>
              </div>
            </div>

            <form action={updateUsername}>
              <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                Display username
              </label>

              <input
                name="username"
                defaultValue={username}
                placeholder="Enter your username"
                className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none transition focus:border-[#b89263] focus:ring-4 focus:ring-[#f1e2cc]"
              />

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Save size={18} />
                  Save username
                </button>
              </div>
            </form>
          </div>

          <div className="card p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1e2cc] text-[#5b3f2a]">
                <KeyRound size={26} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#2a2118]">
                  Change password
                </h2>
                <p className="text-[#7b6f63]">
                  Confirm your old password before setting a new one.
                </p>
              </div>
            </div>

            <form action={updatePassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                  Old password
                </label>

                <input
                  name="oldPassword"
                  type="password"
                  placeholder="Enter old password"
                  className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none transition focus:border-[#b89263] focus:ring-4 focus:ring-[#f1e2cc]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                  New password
                </label>

                <input
                  name="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none transition focus:border-[#b89263] focus:ring-4 focus:ring-[#f1e2cc]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5f5246]">
                  Confirm new password
                </label>

                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full rounded-2xl border border-[#e8dccd] bg-[#fffaf2] px-4 py-3 text-[#2a2118] outline-none transition focus:border-[#b89263] focus:ring-4 focus:ring-[#f1e2cc]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Save size={18} />
                  Update password
                </button>
              </div>
            </form>
          </div>

          <NotificationSettingsCard preferences={notificationPreferences} />
        </div>

        <ThemeCustomizer />
      </div>
    </div>
  );
}