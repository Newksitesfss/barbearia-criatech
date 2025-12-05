import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Haircuts CRUD", () => {
  let createdHaircutId: number;

  it("should create a new haircut", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.haircuts.create({
      name: "Corte Degradê",
      price: 4500, // R$ 45,00 em centavos
      description: "Corte degradê clássico",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list all haircuts", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const haircuts = await caller.haircuts.list();

    expect(Array.isArray(haircuts)).toBe(true);
    expect(haircuts.length).toBeGreaterThan(0);
    
    if (haircuts.length > 0) {
      createdHaircutId = haircuts[0]!.id;
      expect(haircuts[0]).toHaveProperty("name");
      expect(haircuts[0]).toHaveProperty("price");
      expect(haircuts[0]).toHaveProperty("active");
    }
  });

  it("should list only active haircuts", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const activeHaircuts = await caller.haircuts.list({ activeOnly: true });

    expect(Array.isArray(activeHaircuts)).toBe(true);
    activeHaircuts.forEach(haircut => {
      expect(haircut.active).toBe(1);
    });
  });

  it("should update a haircut", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const haircuts = await caller.haircuts.list();
    if (haircuts.length === 0) {
      await caller.haircuts.create({
        name: "Teste Update",
        price: 3000,
      });
      const newHaircuts = await caller.haircuts.list();
      createdHaircutId = newHaircuts[0]!.id;
    } else {
      createdHaircutId = haircuts[0]!.id;
    }

    const result = await caller.haircuts.update({
      id: createdHaircutId,
      name: "Corte Degradê Premium",
      price: 5500,
      description: "Corte degradê premium com acabamento",
    });

    expect(result).toEqual({ success: true });
  });

  it("should toggle haircut active status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const haircuts = await caller.haircuts.list();
    if (haircuts.length === 0) {
      await caller.haircuts.create({
        name: "Teste Toggle",
        price: 3000,
      });
      const newHaircuts = await caller.haircuts.list();
      createdHaircutId = newHaircuts[0]!.id;
    } else {
      createdHaircutId = haircuts[0]!.id;
    }

    const result1 = await caller.haircuts.toggleActive({
      id: createdHaircutId,
      active: 0,
    });
    expect(result1).toEqual({ success: true });

    const result2 = await caller.haircuts.toggleActive({
      id: createdHaircutId,
      active: 1,
    });
    expect(result2).toEqual({ success: true });
  });

  it("should validate price is positive", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.haircuts.create({
        name: "Corte Inválido",
        price: -100,
      })
    ).rejects.toThrow();
  });
});
