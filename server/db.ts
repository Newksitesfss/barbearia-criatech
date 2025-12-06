import { and, between, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { appointments, barbers, haircuts, InsertAppointment, InsertBarber, InsertHaircut, InsertUser, users, User } from "../drizzle/schema";
import { generateSalt, hashPassword } from "./utils/auth";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}





export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}




export async function createUser(data: Omit<InsertUser, "id" | "openId" | "role" | "createdAt" | "updatedAt" | "lastSignedIn"> & { password: string }): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const salt = generateSalt();
  const passwordHash = await hashPassword(data.password, salt);

  const [result] = await db.insert(users).values({
    name: data.name,
    email: data.email,
    passwordHash,
    salt,
    loginMethod: "local",
    role: "user",
  });

  const createdUser = await db.select().from(users).where(eq(users.id, result.insertId)).limit(1);
  if (!createdUser[0]) throw new Error("Failed to retrieve created user");

  return createdUser[0];
}

// ===== BARBEIROS =====

export async function createBarber(userId: number, data: Omit<InsertBarber, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(barbers).values({ ...data, userId, active: 1, createdAt: new Date(), updatedAt: new Date() });
  return result;
}

export async function listBarbers(userId: number, activeOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(barbers.userId, userId)];
  if (activeOnly) {
    conditions.push(eq(barbers.active, 1));
  }

  const query = db.select().from(barbers).where(and(...conditions)).orderBy(desc(barbers.createdAt));
  
  return await query;
}

export async function getBarberById(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(barbers).where(and(eq(barbers.id, id), eq(barbers.userId, userId))).limit(1);
  return result[0];
}

export async function updateBarber(userId: number, id: number, data: Partial<Omit<InsertBarber, "userId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(barbers).set(data).where(and(eq(barbers.id, id), eq(barbers.userId, userId)));
}

export async function toggleBarberActive(userId: number, id: number, active: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(barbers).set({ active }).where(and(eq(barbers.id, id), eq(barbers.userId, userId)));
}

export async function deleteBarber(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(barbers).where(and(eq(barbers.id, id), eq(barbers.userId, userId)));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(data).where(eq(users.id, id));
}

// ===== CORTES =====

export async function createHaircut(userId: number, data: Omit<InsertHaircut, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(haircuts).values({ ...data, userId });
  return result;
}

export async function listHaircuts(userId: number, activeOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(haircuts.userId, userId)];
  if (activeOnly) {
    conditions.push(eq(haircuts.active, 1));
  }

  const query = db.select().from(haircuts).where(and(...conditions)).orderBy(desc(haircuts.createdAt));
  
  return await query;
}

export async function getHaircutById(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(haircuts).where(and(eq(haircuts.id, id), eq(haircuts.userId, userId))).limit(1);
  return result[0];
}

export async function updateHaircut(userId: number, id: number, data: Partial<Omit<InsertHaircut, "userId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(haircuts).set(data).where(and(eq(haircuts.id, id), eq(haircuts.userId, userId)));
}

export async function toggleHaircutActive(userId: number, id: number, active: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(haircuts).set({ active }).where(and(eq(haircuts.id, id), eq(haircuts.userId, userId)));
}

export async function deleteHaircut(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(haircuts).where(and(eq(haircuts.id, id), eq(haircuts.userId, userId)));
}

// ===== ATENDIMENTOS =====

export async function createAppointment(userId: number, data: Omit<InsertAppointment, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(appointments).values({ ...data, userId });
  return result;
}

export async function listAppointments(userId: number, filters?: {
  startDate?: Date;
  endDate?: Date;
  barberId?: number;
  haircutId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(appointments.userId, userId)];

  if (filters?.startDate && filters?.endDate) {
    conditions.push(between(appointments.appointmentDate, filters.startDate, filters.endDate));
  }
  
  if (filters?.barberId) {
    conditions.push(eq(appointments.barberId, filters.barberId));
  }
  
  if (filters?.haircutId) {
    conditions.push(eq(appointments.haircutId, filters.haircutId));
  }

  let query = db
    .select({
      id: appointments.id,
      barberId: appointments.barberId,
      haircutId: appointments.haircutId,
      appointmentDate: appointments.appointmentDate,
      pricePaid: appointments.pricePaid,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      barberName: barbers.name,
      haircutName: haircuts.name,
    })
    .from(appointments)
    .leftJoin(barbers, and(eq(appointments.barberId, barbers.id), eq(barbers.userId, userId)))
    .leftJoin(haircuts, and(eq(appointments.haircutId, haircuts.id), eq(haircuts.userId, userId)))
    .where(and(...conditions))
    .orderBy(desc(appointments.appointmentDate));
  
  return await query;
}

export async function getAppointmentById(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(appointments).where(and(eq(appointments.id, id), eq(appointments.userId, userId))).limit(1);
  return result[0];
}

export async function updateAppointment(userId: number, id: number, data: Partial<Omit<InsertAppointment, "userId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(appointments).set(data).where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
}

export async function deleteAppointment(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(appointments).where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
}

// ===== ESTATÍSTICAS =====

export async function getDailyStats(userId: number, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const dateCondition = between(appointments.appointmentDate, startOfDay, endOfDay);
  const userCondition = eq(appointments.userId, userId);

  // Total de atendimentos e receita do dia
  const dailyTotals = await db
    .select({
      totalAppointments: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`SUM(${appointments.pricePaid})`,
    })
    .from(appointments)
    .where(and(dateCondition, userCondition));
  
  // Cortes mais realizados no dia
  const topHaircuts = await db
    .select({
      haircutId: appointments.haircutId,
      haircutName: haircuts.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(appointments)
    .leftJoin(haircuts, eq(appointments.haircutId, haircuts.id))
    .where(and(dateCondition, userCondition))
    .groupBy(appointments.haircutId, haircuts.name)
    .orderBy(desc(sql`COUNT(*)`));
  
  return {
    totalAppointments: Number(dailyTotals[0]?.totalAppointments || 0),
    totalRevenue: Number(dailyTotals[0]?.totalRevenue || 0),
    topHaircuts,
  };
}

export async function getMonthlyStats(userId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  
  const dateCondition = between(appointments.appointmentDate, startOfMonth, endOfMonth);
  const userCondition = eq(appointments.userId, userId);

  // Total de atendimentos e receita do mês
  const monthlyTotals = await db
    .select({
      totalAppointments: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`SUM(${appointments.pricePaid})`,
    })
    .from(appointments)
    .where(and(dateCondition, userCondition));
  
  // Evolução diária de atendimentos no mês
  const dailyEvolutionRaw: any = await db.execute(sql`
    SELECT 
      DATE(appointmentDate) as appointment_date,
      COUNT(*) as count,
      SUM(pricePaid) as revenue
    FROM appointments
    WHERE appointmentDate BETWEEN ${startOfMonth} AND ${endOfMonth} AND userId = ${userId}
    GROUP BY DATE(appointmentDate)
    ORDER BY DATE(appointmentDate)
  `);
  
  const dailyEvolution = (dailyEvolutionRaw[0] || []).map((row: any) => ({
    date: row.appointment_date,
    count: Number(row.count),
    revenue: Number(row.revenue),
  }));
  
  // Ranking de barbeiros
  const barberRanking = await db
    .select({
      barberId: appointments.barberId,
      barberName: barbers.name,
      totalAppointments: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`SUM(${appointments.pricePaid})`,
    })
    .from(appointments)
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .where(and(dateCondition, userCondition))
    .groupBy(appointments.barberId, barbers.name)
    .orderBy(desc(sql`COUNT(*)`));
  
  return {
    totalAppointments: Number(monthlyTotals[0]?.totalAppointments || 0),
    totalRevenue: Number(monthlyTotals[0]?.totalRevenue || 0),
    dailyEvolution,
    barberRanking,
  };
}
