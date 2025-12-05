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

describe("Appointments and Statistics", () => {
  let testBarberId: number;
  let testHaircutId: number;
  let testAppointmentId: number;

  beforeAll(async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Criar barbeiro de teste
    await caller.barbers.create({
      name: "Barbeiro Teste",
      phone: "11999999999",
    });
    const barbers = await caller.barbers.list();
    testBarberId = barbers[barbers.length - 1]!.id;

    // Criar corte de teste
    await caller.haircuts.create({
      name: "Corte Teste",
      price: 5000,
    });
    const haircuts = await caller.haircuts.list();
    testHaircutId = haircuts[haircuts.length - 1]!.id;
  });

  it("should create a new appointment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.appointments.create({
      barberId: testBarberId,
      haircutId: testHaircutId,
      appointmentDate: new Date(),
      pricePaid: 5000,
      notes: "Atendimento de teste",
    });

    expect(result).toEqual({ success: true });
  });

  it("should list all appointments", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const appointments = await caller.appointments.list();

    expect(Array.isArray(appointments)).toBe(true);
    expect(appointments.length).toBeGreaterThan(0);
    
    if (appointments.length > 0) {
      testAppointmentId = appointments[0]!.id;
      expect(appointments[0]).toHaveProperty("barberName");
      expect(appointments[0]).toHaveProperty("haircutName");
      expect(appointments[0]).toHaveProperty("pricePaid");
    }
  });

  it("should filter appointments by date range", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await caller.appointments.list({
      startDate: today,
      endDate: tomorrow,
    });

    expect(Array.isArray(appointments)).toBe(true);
  });

  it("should filter appointments by barber", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const appointments = await caller.appointments.list({
      barberId: testBarberId,
    });

    expect(Array.isArray(appointments)).toBe(true);
    appointments.forEach(apt => {
      expect(apt.barberId).toBe(testBarberId);
    });
  });

  it("should filter appointments by haircut", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const appointments = await caller.appointments.list({
      haircutId: testHaircutId,
    });

    expect(Array.isArray(appointments)).toBe(true);
    appointments.forEach(apt => {
      expect(apt.haircutId).toBe(testHaircutId);
    });
  });

  it("should update an appointment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const appointments = await caller.appointments.list();
    if (appointments.length === 0) {
      await caller.appointments.create({
        barberId: testBarberId,
        haircutId: testHaircutId,
        appointmentDate: new Date(),
        pricePaid: 5000,
      });
      const newAppointments = await caller.appointments.list();
      testAppointmentId = newAppointments[0]!.id;
    } else {
      testAppointmentId = appointments[0]!.id;
    }

    const result = await caller.appointments.update({
      id: testAppointmentId,
      barberId: testBarberId,
      haircutId: testHaircutId,
      appointmentDate: new Date(),
      pricePaid: 6000,
      notes: "Atendimento atualizado",
    });

    expect(result).toEqual({ success: true });
  });

  it("should get daily statistics", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.stats.daily({ date: new Date() });

    expect(stats).toHaveProperty("totalAppointments");
    expect(stats).toHaveProperty("totalRevenue");
    expect(stats).toHaveProperty("topHaircuts");
    expect(typeof stats.totalAppointments).toBe("number");
    expect(typeof stats.totalRevenue).toBe("number");
    expect(Array.isArray(stats.topHaircuts)).toBe(true);
  });

  it("should get monthly statistics", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const now = new Date();
    const stats = await caller.stats.monthly({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });

    expect(stats).toHaveProperty("totalAppointments");
    expect(stats).toHaveProperty("totalRevenue");
    expect(stats).toHaveProperty("dailyEvolution");
    expect(stats).toHaveProperty("barberRanking");
    expect(typeof stats.totalAppointments).toBe("number");
    expect(typeof stats.totalRevenue).toBe("number");
    expect(Array.isArray(stats.dailyEvolution)).toBe(true);
    expect(Array.isArray(stats.barberRanking)).toBe(true);
  });

  it("should delete an appointment", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Criar um atendimento para deletar
    await caller.appointments.create({
      barberId: testBarberId,
      haircutId: testHaircutId,
      appointmentDate: new Date(),
      pricePaid: 5000,
    });

    const appointments = await caller.appointments.list();
    const appointmentToDelete = appointments[appointments.length - 1]!;

    const result = await caller.appointments.delete({
      id: appointmentToDelete.id,
    });

    expect(result).toEqual({ success: true });
  });
});
