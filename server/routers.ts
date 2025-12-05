import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Barbeiros
  barbers: router({
    list: publicProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        const { listBarbers } = await import("./db");
        return listBarbers(input?.activeOnly);
      }),
    
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        phone: z.string().optional(),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
      }))
      .mutation(async ({ input }) => {
        const { createBarber } = await import("./db");
        await createBarber({
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
        });
        return { success: true };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        phone: z.string().optional(),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
      }))
      .mutation(async ({ input }) => {
        const { updateBarber } = await import("./db");
        await updateBarber(input.id, {
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
        });
        return { success: true };
      }),
    
    toggleActive: publicProcedure
      .input(z.object({ id: z.number(), active: z.number() }))
      .mutation(async ({ input }) => {
        const { toggleBarberActive } = await import("./db");
        await toggleBarberActive(input.id, input.active);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteBarber } = await import("./db");
        await deleteBarber(input.id);
        return { success: true };
      }),
  }),

  // Cortes
  haircuts: router({
    list: publicProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        const { listHaircuts } = await import("./db");
        return listHaircuts(input?.activeOnly);
      }),
    
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        price: z.number().min(0, "Preço deve ser positivo"),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createHaircut } = await import("./db");
        await createHaircut({
          name: input.name,
          price: input.price,
          description: input.description || null,
        });
        return { success: true };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        price: z.number().min(0, "Preço deve ser positivo"),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateHaircut } = await import("./db");
        await updateHaircut(input.id, {
          name: input.name,
          price: input.price,
          description: input.description || null,
        });
        return { success: true };
      }),
    
    toggleActive: publicProcedure
      .input(z.object({ id: z.number(), active: z.number() }))
      .mutation(async ({ input }) => {
        const { toggleHaircutActive } = await import("./db");
        await toggleHaircutActive(input.id, input.active);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteHaircut } = await import("./db");
        await deleteHaircut(input.id);
        return { success: true };
      }),
  }),

  // Atendimentos
  appointments: router({
    list: publicProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        barberId: z.number().optional(),
        haircutId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { listAppointments } = await import("./db");
        return listAppointments(input);
      }),
    
    create: publicProcedure
      .input(z.object({
        barberId: z.number(),
        haircutId: z.number(),
        appointmentDate: z.date(),
        pricePaid: z.number().min(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createAppointment } = await import("./db");
        await createAppointment({
          barberId: input.barberId,
          haircutId: input.haircutId,
          appointmentDate: input.appointmentDate,
          pricePaid: input.pricePaid,
          notes: input.notes || null,
        });
        return { success: true };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        barberId: z.number(),
        haircutId: z.number(),
        appointmentDate: z.date(),
        pricePaid: z.number().min(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateAppointment } = await import("./db");
        await updateAppointment(input.id, {
          barberId: input.barberId,
          haircutId: input.haircutId,
          appointmentDate: input.appointmentDate,
          pricePaid: input.pricePaid,
          notes: input.notes || null,
        });
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteAppointment } = await import("./db");
        await deleteAppointment(input.id);
        return { success: true };
      }),
  }),

  // Estatísticas
  stats: router({
    daily: publicProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const { getDailyStats } = await import("./db");
        return getDailyStats(input.date);
      }),
    
    monthly: publicProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input }) => {
        const { getMonthlyStats } = await import("./db");
        return getMonthlyStats(input.year, input.month);
      }),
  }),
});

export type AppRouter = typeof appRouter;
