import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase";
import {
  createApiContext,
  createGardenClientFixture,
  expectJsonResponse,
  gardenRequest,
  PRIVATE_DATABASE_ERROR,
} from "@/test/garden-api-fixture";
import { POST } from "./garden-crops";

vi.mock(import("../../lib/supabase"), () => ({ createClient: vi.fn() }));

describe("garden crops POST", () => {
  let fixture: ReturnType<typeof createGardenClientFixture>;
  const selection = [
    { cropId: "marchew", proportion: 60 },
    { cropId: "cebula", proportion: 40 },
  ];
  const request = () => gardenRequest("/api/garden-crops", JSON.stringify(selection), "application/json");

  beforeEach(() => {
    vi.resetAllMocks();
    fixture = createGardenClientFixture();
    vi.mocked(createClient).mockReturnValue(fixture.client as unknown as ReturnType<typeof createClient>);
  });

  it("reports unavailable configuration without attempting a write", async () => {
    vi.mocked(createClient).mockReturnValue(null);
    await expectJsonResponse(await POST(createApiContext(request())), 503, { error: "unavailable" });
    expect(fixture.client.auth.getUser).not.toHaveBeenCalled();
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("rejects anonymous submissions without attempting a write", async () => {
    fixture.client.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expectJsonResponse(await POST(createApiContext(request())), 401, { error: "unauthorized" });
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("rejects an unsupported body format before attempting a write", async () => {
    const invalidRequest = gardenRequest("/api/garden-crops", JSON.stringify(selection), "text/plain");
    await expectJsonResponse(await POST(createApiContext(invalidRequest)), 415, { error: "unsupported_media_type" });
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["malformed JSON", "["],
    ["invalid selection", JSON.stringify([{ cropId: "marchew", proportion: 0 }])],
    ["duplicate selections", JSON.stringify([selection[0], selection[0]])],
  ])("rejects %s before attempting a write", async (_label, body) => {
    const invalidRequest = gardenRequest("/api/garden-crops", body, "application/json");
    await expectJsonResponse(await POST(createApiContext(invalidRequest)), 400, { error: "invalid_selection" });
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("reports save failure without false success or private database details", async () => {
    fixture.client.rpc.mockResolvedValue({ data: null, error: PRIVATE_DATABASE_ERROR });
    await expectJsonResponse(await POST(createApiContext(request())), 500, { error: "save_failed" });
    expect(fixture.client.rpc).toHaveBeenCalledOnce();
  });

  it("saves valid selections through the owner RPC", async () => {
    await expectJsonResponse(await POST(createApiContext(request())), 200, { saved: true });
    expect(fixture.client.rpc).toHaveBeenCalledExactlyOnceWith("save_garden_crops", {
      p_crops: [
        { crop_id: "marchew", proportion: 60 },
        { crop_id: "cebula", proportion: 40 },
      ],
    });
  });
});
