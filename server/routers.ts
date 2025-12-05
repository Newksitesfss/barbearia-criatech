import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { verifyPassword } from "./utils/auth";
import { User } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getUserByEmail, createUser } = await import("./db");
        
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Usuário com este email já existe.");
        }

        const user = await createUser({
          name: input.name,
          email: input.email,
          password: input.password,
        });

        // Set session cookie
        const { setSessionCookie } = await import("./_core/cookies");
        setSessionCookie(ctx.res, user.id.toString());

        return { success: true, user };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getUserByEmail } = await import("./db");
        
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash || !user.salt) {
          throw new Error("Credenciais inválidas.");
        }

        const { verifyPassword } = await import("./utils/auth");
        const isValid = await verifyPassword(input.password, user.salt, user.passwordHash);

        if (!isValid) {
          throw new Error("Credenciais inválidas.");
        }

        // Set session cookie
        const { setSessionCookie } = await import("./_core/cookies");
        setSessionCookie(ctx.res, user.id.toString());

        return { success: true, user };
      }),

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
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const { listBarbers } = await import("./db");
        return listBarbers(ctx.user.id, input?.activeOnly);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        phone: z.string().optional(),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createBarber } = await import("./db");
        await createBarber(ctx.user.id, {
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        phone: z.string().optional(),
        email: z.string().email("Email inválido").optional().or(z.literal("")),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateBarber } = await import("./db");
        await updateBarber(ctx.user.id, input.id, {
          name: input.name,
          phone: input.phone || null,
          email: input.email || null,
        });
        return { success: true };
      }),
    
    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), active: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { toggleBarberActive } = await import("./db");
        await toggleBarberActive(ctx.user.id, input.id, input.active);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteBarber } = await import("./db");
        await deleteBarber(ctx.user.id, input.id);
        return { success: true };
      }),
  }),

  // Cortes
  haircuts: router({
    list: protectedProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const { listHaircuts } = await import("./db");
        return listHaircuts(ctx.user.id, input?.activeOnly);
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        price: z.number().min(0, "Preço deve ser positivo"),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createHaircut } = await import("./db");
        await createHaircut(ctx.user.id, {
          name: input.name,
          price: input.price,
          description: input.description || null,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1, "Nome é obrigatório"),
        price: z.number().min(0, "Preço deve ser positivo"),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateHaircut } = await import("./db");
        await updateHaircut(ctx.user.id, input.id, {
          name: input.name,
          price: input.price,
          description: input.description || null,
        });
        return { success: true };
      }),
    
    toggleActive: protectedProcedure
      .input(z.object({ id: z.number(), active: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { toggleHaircutActive } = await import("./db");
        await toggleHaircutActive(ctx.user.id, input.id, input.active);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteHaircut } = await import("./db");
        await deleteHaircut(ctx.user.id, input.id);
        return { success: true };
      }),
  }),

  // Atendimentos
  appointments: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        barberId: z.number().optional(),
        haircutId: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const { listAppointments } = await import("./db");
        return listAppointments(ctx.user.id, input);
      }),
    
    create: protectedProcedure
      .input(z.object({
        barberId: z.number(),
        haircutId: z.number(),
        appointmentDate: z.date(),
        pricePaid: z.number().min(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createAppointment } = await import("./db");
        await createAppointment(ctx.user.id, {
          barberId: input.barberId,
          haircutId: input.haircutId,
          appointmentDate: input.appointmentDate,
          pricePaid: input.pricePaid,
          notes: input.notes || null,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        barberId: z.number(),
        haircutId: z.number(),
        appointmentDate: z.date(),
        pricePaid: z.number().min(0),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateAppointment } = await import("./db");
        await updateAppointment(ctx.user.id, input.id, {
          barberId: input.barberId,
          haircutId: input.haircutId,
          appointmentDate: input.appointmentDate,
          pricePaid: input.pricePaid,
          notes: input.notes || null,
        });
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteAppointment } = await import("./db");
        await deleteAppointment(ctx.user.id, input.id);
        return { success: true };
      }),
  }),

  // Estatísticas
  stats: router({
    daily: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input, ctx }) => {
        const { getDailyStats } = await import("./db");
        return getDailyStats(ctx.user.id, input.date);
      }),
    
    monthly: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getMonthlyStats } = await import("./db");
        return getMonthlyStats(ctx.user.id, input.year, input.month);
      }),
  }),
});

export type AppRouter = typeof appRouter;
