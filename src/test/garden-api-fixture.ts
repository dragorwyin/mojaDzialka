import type { APIContext } from "astro";
import { expect, vi } from "vitest";

export const GARDEN_ID = "10000000-0000-4000-8000-000000000001";
export const SPACE_ID = "20000000-0000-4000-8000-000000000002";
export const PRIVATE_DATABASE_ERROR = { message: "private-database-error-sentinel" };

export interface DatabaseResult {
  data: unknown;
  error: { message: string } | null;
}

type Table = "gardens" | "garden_spaces" | "garden_crops";

export function createGardenClientFixture() {
  // Script only the external responses used by POST; this is not an in-memory DB.
  const reads: Record<Table, DatabaseResult> = {
    gardens: { data: { id: GARDEN_ID, input_revision: 7 }, error: null },
    garden_spaces: {
      data: [{ id: SPACE_ID, name: "Test bed", space_type: "bed", width_cm: 20, length_cm: 30, sort_order: 0 }],
      error: null,
    },
    garden_crops: { data: [{ crop_id: "marchew", proportion: "100" }], error: null },
  };
  const getUser = vi.fn<() => Promise<{ data: { user: { id: string } | null }; error: null }>>().mockResolvedValue({
    data: { user: { id: "30000000-0000-4000-8000-000000000003" } },
    error: null,
  });
  const rpc = vi.fn<(_name: string, _payload: Record<string, unknown>) => Promise<DatabaseResult>>().mockResolvedValue({
    data: true,
    error: null,
  });
  const queryFor = (table: Table) => {
    const order = vi.fn((_column: string, _options?: { ascending: boolean }) => Promise.resolve(reads[table]));
    const eq = vi.fn((_column: string, _value: string) => ({ order }));
    const maybeSingle = vi.fn(() => Promise.resolve(reads[table]));
    const select = vi.fn((_columns: string) => ({ eq, maybeSingle }));
    return { select, eq, order, maybeSingle };
  };
  const queries = {
    gardens: queryFor("gardens"),
    garden_spaces: queryFor("garden_spaces"),
    garden_crops: queryFor("garden_crops"),
  };
  const from = vi.fn((table: Table) => queries[table]);
  return { reads, queries, client: { auth: { getUser }, from, rpc } };
}

export function createApiContext(request: Request): APIContext {
  // The client factory is mocked, so cookies are opaque; other Astro fields are unused.
  return {
    request,
    cookies: {},
    redirect: (location: string, status = 302) => new Response(null, { status, headers: { Location: location } }),
  } as unknown as APIContext;
}

export function gardenSpaceForm(overrides: Partial<Record<string, string>> = {}): FormData {
  const form = new FormData();
  const values = {
    spaceId: SPACE_ID,
    spaceName: " Test bed ",
    spaceType: "bed",
    widthCm: "20",
    lengthCm: "30",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    form.append(key, value);
  }
  return form;
}

export function gardenRequest(path: string, body?: BodyInit, contentType?: string): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    body,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
}

export async function expectJsonResponse(response: Response, status: number, body: Record<string, unknown>) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
  const actualBody: unknown = await response.json();
  expect(actualBody).toEqual(body);
  expect(JSON.stringify(actualBody)).not.toContain(PRIVATE_DATABASE_ERROR.message);
}
