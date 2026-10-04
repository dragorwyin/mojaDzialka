import { expect, test } from "@playwright/test";

test("temporary CI gate probe fails deliberately", () => {
  expect(false).toBe(true);
});
