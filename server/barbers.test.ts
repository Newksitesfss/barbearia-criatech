import { describe, expect, it, beforeAll } from "vitest";
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

describe("Barbers CRUD", () => {
  let createdBarberId: number;

  it("should create a new barber", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.barbers.create({
      name: "João Silva",
      phone: "(11) 98765-4321",
      email: "joao@exemplo.com",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list all barbers", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const barbers = await caller.barbers.list();

    expect(Array.isArray(barbers)).toBe(true);
    expect(barbers.length).toBeGreaterThan(0);
    
    // Salvar ID do primeiro barbeiro para testes seguintes
    if (barbers.length > 0) {
      createdBarberId = barbers[0]!.id;
      expect(barbers[0]).toHaveProperty("name");
      expect(barbers[0]).toHaveProperty("active");
    }
  });

  it("should list only active barbers", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const activeBarbers = await caller.barbers.list({ activeOnly: true });

    expect(Array.isArray(activeBarbers)).toBe(true);
    activeBarbers.forEach(barber => {
      expect(barber.active).toBe(1);
    });
  });

  it("should update a barber", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Primeiro, obter um barbeiro existente
    const barbers = await caller.barbers.list();
    if (barbers.length === 0) {
      // Criar um barbeiro se não existir
      await caller.barbers.create({
        name: "Teste Update",
        phone: "1234567890",
      });
      const newBarbers = await caller.barbers.list();
      createdBarberId = newBarbers[0]!.id;
    } else {
      createdBarberId = barbers[0]!.id;
    }

    const result = await caller.barbers.update({
      id: createdBarberId,
      name: "João Silva Atualizado",
      phone: "(11) 99999-9999",
      email: "joao.novo@exemplo.com",
    });

    expect(result).toEqual({ success: true });
  });

  it("should toggle barber active status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Garantir que temos um barbeiro
    const barbers = await caller.barbers.list();
    if (barbers.length === 0) {
      await caller.barbers.create({
        name: "Teste Toggle",
        phone: "1234567890",
      });
      const newBarbers = await caller.barbers.list();
      createdBarberId = newBarbers[0]!.id;
    } else {
      createdBarberId = barbers[0]!.id;
    }

    // Desativar
    const result1 = await caller.barbers.toggleActive({
      id: createdBarberId,
      active: 0,
    });
    expect(result1).toEqual({ success: true });

    // Reativar
    const result2 = await caller.barbers.toggleActive({
      id: createdBarberId,
      active: 1,
    });
    expect(result2).toEqual({ success: true });
  });
});
