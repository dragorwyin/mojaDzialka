import type { APIRoute } from "astro";

import { createClient } from "@/lib/supabase";
import { validateGardenCropSelection } from "@/lib/garden-crop-selection";

export const prerender = false;

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return jsonResponse({ error: "unavailable" }, 503);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  const contentType = context.request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return jsonResponse({ error: "unsupported_media_type" }, 415);

  let payload: unknown;
  try {
    payload = await context.request.json();
  } catch {
    return jsonResponse({ error: "invalid_selection" }, 400);
  }

  const selections = validateGardenCropSelection(payload);
  if (selections === null) return jsonResponse({ error: "invalid_selection" }, 400);

  const { error } = await supabase.rpc("save_garden_crops", {
    p_crops: selections.map(({ cropId, proportion }) => ({ crop_id: cropId, proportion })),
  });
  if (error) return jsonResponse({ error: "save_failed" }, 500);

  return jsonResponse({ saved: true }, 200);
};
