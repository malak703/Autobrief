import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const { data: owners, error: ownerError } = await supabase
      .from("business_owners")
      .select("id")
      .eq("user_id", user.id);

    if (ownerError) {
      return NextResponse.json(
        { error: ownerError.message },
        { status: 500 }
      );
    }

    if (!owners || owners.length === 0) {
      return NextResponse.json(
        { error: "Workspace profile is missing." },
        { status: 400 }
      );
    }

    const owner = owners[0];

    const { data: clients, error } = await supabase
      .from("clients")
      .select("id, name, company")
      .eq("owner_id", owner.id)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error while fetching clients." },
      { status: 500 }
    );
  }
}
