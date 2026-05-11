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
    const body = (await res.json().catch(() => ({}))) as {
      status?: string;
      service?: string;
      post_routes?: string[];
    };

    let pipelineRouteFound = false;
    try {
      const oCtrl = new AbortController();
      const ot = setTimeout(() => oCtrl.abort(), 5000);
      try {
        const oRes = await fetch(`${baseUrl}/openapi.json`, {
          cache: "no-store",
          signal: oCtrl.signal,
        });
        if (oRes.ok) {
          const spec = (await oRes.json().catch(() => ({}))) as {
            paths?: Record<string, unknown>;
          };
          pipelineRouteFound = Boolean(spec.paths?.["/filter-and-generate-brief"]);
        }
      } finally {
        clearTimeout(ot);
      }
    } catch {
      /* ignore */
    }

    const wrongService =
      body.service !== "autobrief-fastapi-extract" && body.status === "ok";

    return NextResponse.json({
      ok: true,
      baseUrl,
      extract: body,
      pipeline_route_found: pipelineRouteFound,
      hint: "Voice, image OCR, and the filter+brief pipeline use this FastAPI service.",
      warning:
        wrongService || !pipelineRouteFound
          ? "GET /health responded but this does not look like the current Autobrief FastAPI (missing service id or /filter-and-generate-brief in OpenAPI). Restart uvicorn from autobrief/fastapi-service and fix EXTRACT_SERVICE_URL."
          : undefined,
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
