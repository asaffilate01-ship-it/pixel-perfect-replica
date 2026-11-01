import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { ApiAuthError, errorResponse } from "../src/lib/domureva/security/apiAuth.server";

describe("Public API errors", () => {
  test("never leaks raw internal or database errors", async () => {
    const response = errorResponse(new Error("database password: must-never-leak"), 400);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "REQUEST_FAILED" });
  });
  test("returns a stable input validation code without input values", async () => {
    const result = z.object({ caseId: z.string().uuid() }).safeParse({ caseId: "private-user-input" });
    if (result.success) throw new Error("Expected invalid input");
    const response = errorResponse(result.error);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string; issues: unknown[] };
    expect(body.error).toBe("INVALID_REQUEST");
    expect(JSON.stringify(body)).not.toContain("private-user-input");
  });
  test("preserves deliberate access-control response status", async () => {
    const response = errorResponse(new ApiAuthError("FORBIDDEN", 403));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "FORBIDDEN" });
  });
});
