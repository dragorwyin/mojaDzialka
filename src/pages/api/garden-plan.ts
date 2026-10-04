import type { APIRoute } from "astro";

import { getCropById } from "@/lib/crop-catalog";
import {
  createGardenInputSnapshot,
  fingerprintGardenInputSnapshot,
  type GardenSnapshotCrop,
  type GardenSnapshotSpace,
} from "@/lib/garden-plan-snapshot";
import { createClient } from "@/lib/supabase";
import { GardenLayoutSearchLimitError, generateGardenLayout, type GardenLayoutResult } from "@/lib/garden-layout";

export const prerender = false;

interface GardenSpaceRow {
  id: string;
  name: string;
  space_type: "bed" | "sector";
  width_cm: number;
  length_cm: number;
  sort_order: number;
}

interface GardenCropRow {
  crop_id: string;
  proportion: number | string;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function parsePositiveDimension(value: unknown): number | null {
  const dimension = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(dimension) && dimension > 0 ? dimension : null;
}

function parsePositiveProportion(value: unknown): number | null {
  const proportion = typeof value === "number" ? value : Number(value);
  return Number.isFinite(proportion) && proportion > 0 ? proportion : null;
}

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return jsonResponse({ error: "unavailable" }, 503);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  const { data: garden, error: gardenError } = await supabase
    .from("gardens")
    .select("id, input_revision")
    .maybeSingle();
  if (gardenError) return jsonResponse({ error: "load_failed" }, 500);
  if (!garden) return jsonResponse({ error: "missing_garden" }, 422);
  const expectedInputRevision = Number(garden.input_revision);
  if (!Number.isSafeInteger(expectedInputRevision) || expectedInputRevision < 0) {
    return jsonResponse({ error: "load_failed" }, 500);
  }

  const [{ data: spaceRows, error: spacesError }, { data: cropRows, error: cropsError }] = await Promise.all([
    supabase
      .from("garden_spaces")
      .select("id, name, space_type, width_cm, length_cm, sort_order")
      .eq("garden_id", garden.id)
      .order("sort_order", { ascending: true }),
    supabase.from("garden_crops").select("crop_id, proportion").eq("garden_id", garden.id).order("crop_id"),
  ]);

  if (spacesError || cropsError) return jsonResponse({ error: "load_failed" }, 500);
  if (spaceRows.length === 0) return jsonResponse({ error: "missing_spaces" }, 422);
  if (cropRows.length === 0) return jsonResponse({ error: "missing_crops" }, 422);

  const spaces: GardenSnapshotSpace[] = [];
  for (const row of spaceRows as GardenSpaceRow[]) {
    const widthCm = parsePositiveDimension(row.width_cm);
    const lengthCm = parsePositiveDimension(row.length_cm);
    if (row.name.trim().length === 0 || widthCm === null || lengthCm === null) {
      return jsonResponse({ error: "invalid_garden_data" }, 422);
    }
    spaces.push({
      id: row.id,
      name: row.name,
      spaceType: row.space_type,
      widthCm,
      lengthCm,
      sortOrder: row.sort_order,
    });
  }

  const crops: GardenSnapshotCrop[] = [];
  const selections = [];
  for (const row of cropRows as GardenCropRow[]) {
    const crop = getCropById(row.crop_id);
    const proportion = parsePositiveProportion(row.proportion);
    if (!crop || proportion === null) return jsonResponse({ error: "invalid_crops" }, 422);

    const proportionText = String(row.proportion);
    crops.push({ cropId: row.crop_id, proportion: proportionText });
    selections.push({ crop, proportion });
  }

  const snapshot = createGardenInputSnapshot(spaces, crops);
  const inputFingerprint = await fingerprintGardenInputSnapshot(snapshot);
  let plan: GardenLayoutResult;
  try {
    plan = generateGardenLayout({
      spaces: spaces.map(({ spaceType: _spaceType, sortOrder: _sortOrder, ...space }) => space),
      crops: selections,
    });
  } catch (error) {
    if (error instanceof GardenLayoutSearchLimitError) return jsonResponse({ error: "search_limit" }, 422);
    throw error;
  }
  const generatedAt = new Date().toISOString();

  const saveResult = await supabase.rpc("save_garden_plan_if_current", {
    p_expected_input_revision: expectedInputRevision,
    p_plan: plan,
    p_input_snapshot: snapshot,
    p_input_fingerprint: inputFingerprint,
    p_generated_at: generatedAt,
  });
  if (saveResult.error) return jsonResponse({ error: "save_failed" }, 500);
  const saved: unknown = saveResult.data;
  if (saved !== true) return jsonResponse({ error: "inputs_changed" }, 409);

  return jsonResponse({ saved: true, inputFingerprint, generatedAt, plan }, 200);
};
