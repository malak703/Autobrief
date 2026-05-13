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
          Manage your username and password.
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
        </div>

        <ThemeCustomizer />
      </div>
    </div>
  );
}