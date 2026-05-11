import { NextResponse } from "next/server";
import { getExtractServiceBaseUrl } from "@/lib/extract-service";

/**
 * Lets you verify the Next.js server can reach the FastAPI extract service.
 * Open: http://localhost:3000/api/extract-health (or your app origin).
 */
export async function GET() {
  const baseUrl = getExtractServiceBaseUrl();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/health`, {
        cache: "no-store",
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Extract service returned HTTP ${res.status}` },
        { status: 502 }
      );
    }
    const body = (await res.json().catch(() => ({}))) as { status?: string };
    return NextResponse.json({
      ok: true,
      extract: body,
      hint: "Voice and image uploads use this service during brief creation.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: `Expected FastAPI at ${baseUrl}. Set EXTRACT_SERVICE_URL in .env.local if it runs elsewhere.`,
      },
      { status: 503 }
    );
  }
}
