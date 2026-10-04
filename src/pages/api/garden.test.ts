import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase";
import {
  createApiContext,
  createGardenClientFixture,
  gardenRequest,
  gardenSpaceForm,
  PRIVATE_DATABASE_ERROR,
  SPACE_ID,
} from "@/test/garden-api-fixture";
import { POST } from "./garden";

vi.mock(import("../../lib/supabase"), () => ({ createClient: vi.fn() }));

describe("garden space POST", () => {
  let fixture: ReturnType<typeof createGardenClientFixture>;

  beforeEach(() => {
    vi.resetAllMocks();
    fixture = createGardenClientFixture();
    vi.mocked(createClient).mockReturnValue(fixture.client as unknown as ReturnType<typeof createClient>);
  });

  it("redirects unavailable configuration without attempting a write", async () => {
    vi.mocked(createClient).mockReturnValue(null);
    const response = await POST(createApiContext(gardenRequest("/api/garden", gardenSpaceForm())));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/garden?error=unavailable");
    expect(fixture.client.auth.getUser).not.toHaveBeenCalled();
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("redirects anonymous submissions to signin without attempting a write", async () => {
    fixture.client.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(createApiContext(gardenRequest("/api/garden", gardenSpaceForm())));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/auth/signin?returnTo=%2Fgarden");
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("rejects malformed multipart without attempting a write", async () => {
    const request = gardenRequest("/api/garden", "truncated multipart", "multipart/form-data");
    const response = await POST(createApiContext(request));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/garden?error=invalid_spaces");
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid dimensions", { widthCm: "0" }],
    ["foreign ID format", { spaceId: "invalid-id" }],
    ["missing name", { spaceName: "   " }],
  ])("rejects %s before attempting a write", async (_label, overrides) => {
    const response = await POST(createApiContext(gardenRequest("/api/garden", gardenSpaceForm(overrides))));
    expect(response.headers.get("Location")).toBe("/garden?error=invalid_spaces");
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("rejects a mismatched form row before attempting a write", async () => {
    const form = gardenSpaceForm();
    form.append("spaceName", "Missing dimensions");
    const response = await POST(createApiContext(gardenRequest("/api/garden", form)));
    expect(response.headers.get("Location")).toBe("/garden?error=invalid_spaces");
    expect(fixture.client.rpc).not.toHaveBeenCalled();
  });

  it("reports RPC failure without a saved redirect or private details", async () => {
    fixture.client.rpc.mockResolvedValue({ data: null, error: PRIVATE_DATABASE_ERROR });
    const response = await POST(createApiContext(gardenRequest("/api/garden", gardenSpaceForm())));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/garden?error=save_failed");
    expect(await response.text()).not.toContain(PRIVATE_DATABASE_ERROR.message);
    expect(fixture.client.rpc).toHaveBeenCalledOnce();
  });

  it("saves normalized spaces and reports success after the RPC succeeds", async () => {
    const response = await POST(createApiContext(gardenRequest("/api/garden", gardenSpaceForm())));
    expect(fixture.client.rpc).toHaveBeenCalledExactlyOnceWith("save_garden_spaces", {
      p_spaces: [{ id: SPACE_ID, name: "Test bed", space_type: "bed", width_cm: 20, length_cm: 30 }],
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/garden?saved=1");
  });
});
