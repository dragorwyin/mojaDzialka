import { describe, expect, it, vi } from "vitest";

import { shouldBlockGardenSpaceSubmit } from "./garden-space-change.js";

describe("garden space change confirmation", () => {
  it("blocks submission when a structural change is not confirmed", () => {
    const confirm = vi.fn(() => false);

    expect(
      shouldBlockGardenSpaceSubmit({
        hasSavedPlan: true,
        initialSpaceIds: ["space-1"],
        currentSpaces: [{ persistedId: "space-1" }, { persistedId: null }],
        confirm,
      }),
    ).toBe(true);
    expect(confirm).toHaveBeenCalledOnce();
  });

  it("does not prompt or block a structural change when there is no saved plan", () => {
    const confirm = vi.fn(() => false);

    expect(
      shouldBlockGardenSpaceSubmit({
        hasSavedPlan: false,
        initialSpaceIds: ["space-1"],
        currentSpaces: [],
        confirm,
      }),
    ).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("does not prompt or block when existing spaces are only edited", () => {
    const confirm = vi.fn(() => false);

    expect(
      shouldBlockGardenSpaceSubmit({
        hasSavedPlan: true,
        initialSpaceIds: ["space-1", "space-2"],
        currentSpaces: [{ persistedId: "space-1" }, { persistedId: "space-2" }],
        confirm,
      }),
    ).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });
});
