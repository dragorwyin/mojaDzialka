import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readGardenLayoutResult } from "@/lib/garden-layout";
import {
  GARDEN_CROP_CATALOG_VERSION,
  GARDEN_INPUT_SNAPSHOT_VERSION,
  GARDEN_LAYOUT_ALGORITHM_VERSION,
} from "@/lib/garden-plan-snapshot";
import { createClient } from "@/lib/supabase";
import {
  createApiContext,
  createGardenClientFixture,
  type DatabaseResult,
  expectJsonResponse,
  GARDEN_ID,
  gardenRequest,
  PRIVATE_DATABASE_ERROR,
  SPACE_ID,
} from "@/test/garden-api-fixture";
import { POST } from "./garden-plan";

vi.mock(import("../../lib/supabase"), () => ({ createClient: vi.fn() }));

describe("garden plan POST", () => {
  let fixture: ReturnType<typeof createGardenClientFixture>;
  const request = () => gardenRequest("/api/garden-plan");

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-04T12:00:00.000Z"));
    fixture = createGardenClientFixture();
    vi.mocked(createClient).mockReturnValue(fixture.client as unknown as ReturnType<typeof createClient>);
  });

  afterEach(() => vi.useRealTimers());

  it("reports unavailable configuration without reading or saving inputs", async () => {
    vi.mocked(createClient).mockReturnValue(null);
    await expectJsonResponse(await POST(createApiContext(request())), 503, { error: "unavailable" });
    expect(fixture.client.auth.getUser).not.toHaveBeenCalled();
    expect(fixture.client.from).not.toHaveBeenCalled();
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("rejects anonymous generation without reading or saving inputs", async () => {
    fixture.client.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expectJsonResponse(await POST(createApiContext(request())), 401, { error: "unauthorized" });
    expect(fixture.client.from).not.toHaveBeenCalled();
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it.each(["gardens", "garden_spaces", "garden_crops"] as const)(
    "reports %s read failure instead of treating the garden as empty",
    async (table) => {
      fixture.reads[table] = { data: null, error: PRIVATE_DATABASE_ERROR };
      await expectJsonResponse(await POST(createApiContext(request())), 500, { error: "load_failed" });
      expect(fixture.client.rpc).not.toHaveBeenCalled();
    },
  );

  it.each([
    { table: "gardens" as const, data: null, error: "missing_garden" },
    { table: "garden_spaces" as const, data: [], error: "missing_spaces" },
    { table: "garden_crops" as const, data: [], error: "missing_crops" },
  ])("reports $error when $table is successfully read but empty", async ({ table, data, error }) => {
    fixture.reads[table] = { data, error: null };
    await expectJsonResponse(await POST(createApiContext(request())), 422, { error });
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("rejects unusable persisted dimensions before saving", async () => {
    fixture.reads.garden_spaces.data = [
      { id: SPACE_ID, name: "Test bed", space_type: "bed", width_cm: 0, length_cm: 30, sort_order: 0 },
    ];
    await expectJsonResponse(await POST(createApiContext(request())), 422, { error: "invalid_garden_data" });
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("rejects unknown persisted crops before saving", async () => {
    fixture.reads.garden_crops.data = [{ crop_id: "unknown-crop", proportion: "100" }];
    await expectJsonResponse(await POST(createApiContext(request())), 422, { error: "invalid_crops" });
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("reports an unusable input revision as a load failure without saving", async () => {
    fixture.reads.gardens.data = { id: GARDEN_ID, input_revision: "invalid-revision" };
    await expectJsonResponse(await POST(createApiContext(request())), 500, { error: "load_failed" });
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("reports RPC failure without false success or private database details", async () => {
    fixture.client.rpc.mockResolvedValue({ data: null, error: PRIVATE_DATABASE_ERROR });
    await expectJsonResponse(await POST(createApiContext(request())), 500, { error: "save_failed" });
    expect(fixture.client.rpc).toHaveBeenCalledOnce();
  });

  it("reports a conflict if inputs change between reading and conditional save", async () => {
    fixture.client.rpc.mockImplementationOnce(() => {
      fixture.reads.gardens.data = { id: GARDEN_ID, input_revision: 8 };
      return Promise.resolve({ data: false, error: null });
    });
    await expectJsonResponse(await POST(createApiContext(request())), 409, { error: "inputs_changed" });
    expect(fixture.client.rpc).toHaveBeenCalledExactlyOnceWith(
      "save_garden_plan_if_current",
      expect.objectContaining({ p_expected_input_revision: 7 }),
    );
  });

  it("does not claim success without an explicit true from conditional save", async () => {
    fixture.client.rpc.mockResolvedValue({ data: null, error: null });
    await expectJsonResponse(await POST(createApiContext(request())), 409, { error: "inputs_changed" });
  });

  it("passes the read revision, actual snapshot and generated layout to conditional save", async () => {
    const expectedSnapshot = {
      version: GARDEN_INPUT_SNAPSHOT_VERSION,
      catalogVersion: GARDEN_CROP_CATALOG_VERSION,
      algorithmVersion: GARDEN_LAYOUT_ALGORITHM_VERSION,
      spaces: [{ id: SPACE_ID, name: "Test bed", spaceType: "bed", widthCm: 20, lengthCm: 30, sortOrder: 0 }],
      crops: [{ cropId: "marchew", proportion: "100" }],
    };
    // Independent hashing of the literal expected payload, not the production fingerprint helper.
    const expectedFingerprint = createHash("sha256").update(JSON.stringify(expectedSnapshot)).digest("hex");
    const response = await POST(createApiContext(request()));
    const savedPayload = fixture.client.rpc.mock.calls[0][1];
    expect(savedPayload).toBeDefined();
    expect(fixture.client.rpc).toHaveBeenCalledExactlyOnceWith("save_garden_plan_if_current", {
      p_expected_input_revision: 7,
      p_input_snapshot: expectedSnapshot,
      p_input_fingerprint: expectedFingerprint,
      p_generated_at: "2026-10-04T12:00:00.000Z",
      p_plan: savedPayload.p_plan,
    });
    expect(savedPayload.p_plan).toMatchObject({
      spaces: [{ space: { id: SPACE_ID, name: "Test bed", widthCm: 20, lengthCm: 30 } }],
      cropSummaries: [{ cropId: "marchew" }],
    });
    expect(readGardenLayoutResult(savedPayload.p_plan)).not.toBeNull();
    await expectJsonResponse(response, 200, {
      saved: true,
      inputFingerprint: expectedFingerprint,
      generatedAt: "2026-10-04T12:00:00.000Z",
      plan: savedPayload.p_plan,
    });
    expect(fixture.queries.garden_spaces.eq).toHaveBeenCalledWith("garden_id", GARDEN_ID);
    expect(fixture.queries.garden_crops.eq).toHaveBeenCalledWith("garden_id", GARDEN_ID);
  });

  it("waits for conditional save before returning success", async () => {
    const pendingSave = Promise.withResolvers<DatabaseResult>();
    const enteredSave = Promise.withResolvers<undefined>();
    fixture.client.rpc.mockImplementationOnce(() => {
      enteredSave.resolve(undefined);
      return pendingSave.promise;
    });
    let responded = false;
    const pendingResponse = Promise.resolve(POST(createApiContext(request()))).then((response) => {
      responded = true;
      return response;
    });
    await enteredSave.promise;
    expect(responded).toBe(false);
    pendingSave.resolve({ data: true, error: null });
    const response = await pendingResponse;
    expect(response.status).toBe(200);
    expect(responded).toBe(true);
  });
});
