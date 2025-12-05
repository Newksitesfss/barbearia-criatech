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

describe("Delete Operations", () => {
  it("should delete a barber", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Criar um barbeiro para deletar
    await caller.barbers.create({
      name: "Barbeiro para Deletar",
      phone: "11999999999",
    });

    const barbers = await caller.barbers.list();
    const barberToDelete = barbers.find(b => b.name === "Barbeiro para Deletar");
    
    if (barberToDelete) {
      const result = await caller.barbers.delete({ id: barberToDelete.id });
      expect(result).toEqual({ success: true });

      // Verificar que foi deletado
      const barbersAfter = await caller.barbers.list();
      const stillExists = barbersAfter.find(b => b.id === barberToDelete.id);
      expect(stillExists).toBeUndefined();
    }
  });

  it("should delete a haircut", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Criar um corte para deletar
    await caller.haircuts.create({
      name: "Corte para Deletar",
      price: 3000,
    });

    const haircuts = await caller.haircuts.list();
    const haircutToDelete = haircuts.find(h => h.name === "Corte para Deletar");
    
    if (haircutToDelete) {
      const result = await caller.haircuts.delete({ id: haircutToDelete.id });
      expect(result).toEqual({ success: true });

      // Verificar que foi deletado
      const haircutsAfter = await caller.haircuts.list();
      const stillExists = haircutsAfter.find(h => h.id === haircutToDelete.id);
      expect(stillExists).toBeUndefined();
    }
  });

  it("should delete an appointment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Criar barbeiro e corte
    await caller.barbers.create({
      name: "Barbeiro Teste Delete",
      phone: "11999999999",
    });
    await caller.haircuts.create({
      name: "Corte Teste Delete",
      price: 5000,
    });

    const barbers = await caller.barbers.list();
    const haircuts = await caller.haircuts.list();
    const barber = barbers[barbers.length - 1];
    const haircut = haircuts[haircuts.length - 1];

    if (barber && haircut) {
      // Criar atendimento
      await caller.appointments.create({
        barberId: barber.id,
        haircutId: haircut.id,
        appointmentDate: new Date(),
        pricePaid: 5000,
        notes: "Atendimento para deletar",
      });

      const appointments = await caller.appointments.list();
      const appointmentToDelete = appointments.find(a => a.notes === "Atendimento para deletar");

      if (appointmentToDelete) {
        const result = await caller.appointments.delete({ id: appointmentToDelete.id });
        expect(result).toEqual({ success: true });

        // Verificar que foi deletado
        const appointmentsAfter = await caller.appointments.list();
        const stillExists = appointmentsAfter.find(a => a.id === appointmentToDelete.id);
        expect(stillExists).toBeUndefined();
      }
    }
  });
});
