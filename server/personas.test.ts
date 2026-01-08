import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("personas router", () => {
  it("should list all active personas", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const personas = await caller.personas.list();

    expect(personas).toBeDefined();
    expect(Array.isArray(personas)).toBe(true);
    expect(personas.length).toBeGreaterThan(0);
    
    // Check that Warren Buffett persona exists
    const buffett = personas.find(p => p.personaId === "warren_buffett");
    expect(buffett).toBeDefined();
    expect(buffett?.name).toBe("Warren Buffett");
    expect(buffett?.isActive).toBe(true);
  });

  it("should get persona by id", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // First get all personas to find a valid ID
    const personas = await caller.personas.list();
    expect(personas.length).toBeGreaterThan(0);

    const firstPersona = personas[0];
    const result = await caller.personas.getById({ id: firstPersona.id });

    expect(result).toBeDefined();
    expect(result?.id).toBe(firstPersona.id);
    expect(result?.personaId).toBe(firstPersona.personaId);
    expect(result?.name).toBe(firstPersona.name);
  });

  it("should return undefined for non-existent persona id", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.personas.getById({ id: 999999 });

    expect(result).toBeUndefined();
  });

  it("should have required persona fields", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const personas = await caller.personas.list();
    const persona = personas[0];

    expect(persona).toHaveProperty("id");
    expect(persona).toHaveProperty("personaId");
    expect(persona).toHaveProperty("name");
    expect(persona).toHaveProperty("description");
    expect(persona).toHaveProperty("investmentPhilosophy");
    expect(persona).toHaveProperty("isActive");
    expect(persona).toHaveProperty("displayOrder");
    expect(persona).toHaveProperty("createdAt");
    expect(persona).toHaveProperty("updatedAt");
  });
});
