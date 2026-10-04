import type { APIRoute } from "astro";
import { createClient } from "@/lib/supabase";

export const prerender = false;

const MAX_NAME_LENGTH = 80;
const MAX_DIMENSION_CM = 100_000;
const VALID_SPACE_TYPES = new Set(["bed", "sector"]);

function redirectWithError(context: Parameters<APIRoute>[0], code: string) {
  return context.redirect(`/garden?error=${encodeURIComponent(code)}`);
}

function getStrings(form: FormData, key: string) {
  return form.getAll(key).map((value) => (typeof value === "string" ? value : ""));
}

function parseDimension(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const dimension = Number(value);
  return Number.isSafeInteger(dimension) && dimension > 0 && dimension <= MAX_DIMENSION_CM ? dimension : null;
}

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);
  if (!supabase) return redirectWithError(context, "unavailable");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return context.redirect("/auth/signin?returnTo=%2Fgarden");

  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return redirectWithError(context, "invalid_spaces");
  }
  const names = getStrings(form, "spaceName");
  const ids = getStrings(form, "spaceId");
  const types = getStrings(form, "spaceType");
  const widths = getStrings(form, "widthCm");
  const lengths = getStrings(form, "lengthCm");

  if (
    !names.length ||
    names.length !== ids.length ||
    names.length !== types.length ||
    names.length !== widths.length ||
    names.length !== lengths.length
  ) {
    return redirectWithError(context, "invalid_spaces");
  }

  const spaces = names.map((rawName, index) => {
    const name = rawName.trim();
    const id = ids[index].trim() || null;
    const width = parseDimension(widths[index]);
    const length = parseDimension(lengths[index]);
    const spaceType = types[index];

    if (
      !name ||
      name.length > MAX_NAME_LENGTH ||
      !VALID_SPACE_TYPES.has(spaceType) ||
      (id !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) ||
      width === null ||
      length === null
    ) {
      return null;
    }

    return {
      id,
      name,
      space_type: spaceType,
      width_cm: width,
      length_cm: length,
    };
  });

  if (spaces.some((space) => space === null)) return redirectWithError(context, "invalid_spaces");
  const submittedIds = spaces.flatMap((space) => (space?.id ? [space.id] : []));
  if (new Set(submittedIds).size !== submittedIds.length) return redirectWithError(context, "invalid_spaces");

  const { error } = await supabase.rpc("save_garden_spaces", { p_spaces: spaces });
  if (error) {
    return redirectWithError(context, "save_failed");
  }

  return context.redirect("/garden?saved=1");
};
