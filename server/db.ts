import { and, between, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { appointments, barbers, haircuts, InsertAppointment, InsertBarber, InsertHaircut, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== BARBEIROS =====

export async function createBarber(data: InsertBarber) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(barbers).values(data);
  return result;
}

export async function listBarbers(activeOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const query = activeOnly 
    ? db.select().from(barbers).where(eq(barbers.active, 1)).orderBy(desc(barbers.createdAt))
    : db.select().from(barbers).orderBy(desc(barbers.createdAt));
  
  return await query;
}

export async function getBarberById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(barbers).where(eq(barbers.id, id)).limit(1);
  return result[0];
}

export async function updateBarber(id: number, data: Partial<InsertBarber>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(barbers).set(data).where(eq(barbers.id, id));
}

export async function toggleBarberActive(id: number, active: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(barbers).set({ active }).where(eq(barbers.id, id));
}

// ===== CORTES =====

export async function createHaircut(data: InsertHaircut) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(haircuts).values(data);
  return result;
}

export async function listHaircuts(activeOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const query = activeOnly 
    ? db.select().from(haircuts).where(eq(haircuts.active, 1)).orderBy(desc(haircuts.createdAt))
    : db.select().from(haircuts).orderBy(desc(haircuts.createdAt));
  
  return await query;
}

export async function getHaircutById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(haircuts).where(eq(haircuts.id, id)).limit(1);
  return result[0];
}

export async function updateHaircut(id: number, data: Partial<InsertHaircut>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(haircuts).set(data).where(eq(haircuts.id, id));
}

export async function toggleHaircutActive(id: number, active: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(haircuts).set({ active }).where(eq(haircuts.id, id));
}

// ===== ATENDIMENTOS =====

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(appointments).values(data);
  return result;
}

export async function listAppointments(filters?: {
  startDate?: Date;
  endDate?: Date;
  barberId?: number;
  haircutId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
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
    .leftJoin(barbers, eq(appointments.barberId, barbers.id))
    .leftJoin(haircuts, eq(appointments.haircutId, haircuts.id))
    .orderBy(desc(appointments.appointmentDate));
  
  const conditions = [];
  
  if (filters?.startDate && filters?.endDate) {
    conditions.push(between(appointments.appointmentDate, filters.startDate, filters.endDate));
  }
  
  if (filters?.barberId) {
    conditions.push(eq(appointments.barberId, filters.barberId));
  }
  
  if (filters?.haircutId) {
    conditions.push(eq(appointments.haircutId, filters.haircutId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  
  return await query;
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result[0];
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(appointments).where(eq(appointments.id, id));
}

// ===== ESTATÍSTICAS =====

export async function getDailyStats(date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Total de atendimentos e receita do dia
  const dailyTotals = await db
    .select({
      totalAppointments: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`SUM(${appointments.pricePaid})`,
    })
    .from(appointments)
    .where(between(appointments.appointmentDate, startOfDay, endOfDay));
  
  // Cortes mais realizados no dia
  const topHaircuts = await db
    .select({
      haircutId: appointments.haircutId,
      haircutName: haircuts.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(appointments)
    .leftJoin(haircuts, eq(appointments.haircutId, haircuts.id))
    .where(between(appointments.appointmentDate, startOfDay, endOfDay))
    .groupBy(appointments.haircutId, haircuts.name)
    .orderBy(desc(sql`COUNT(*)`));
  
  return {
    totalAppointments: Number(dailyTotals[0]?.totalAppointments || 0),
    totalRevenue: Number(dailyTotals[0]?.totalRevenue || 0),
    topHaircuts,
  };
}

export async function getMonthlyStats(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  
  // Total de atendimentos e receita do mês
  const monthlyTotals = await db
    .select({
      totalAppointments: sql<number>`COUNT(*)`,
      totalRevenue: sql<number>`SUM(${appointments.pricePaid})`,
    })
    .from(appointments)
    .where(between(appointments.appointmentDate, startOfMonth, endOfMonth));
  
  // Evolução diária de atendimentos no mês
  const dailyEvolutionRaw: any = await db.execute(sql`
    SELECT 
      DATE(appointmentDate) as appointment_date,
      COUNT(*) as count,
      SUM(pricePaid) as revenue
    FROM appointments
    WHERE appointmentDate BETWEEN ${startOfMonth} AND ${endOfMonth}
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
    .where(between(appointments.appointmentDate, startOfMonth, endOfMonth))
    .groupBy(appointments.barberId, barbers.name)
    .orderBy(desc(sql`COUNT(*)`));
  
  return {
    totalAppointments: Number(monthlyTotals[0]?.totalAppointments || 0),
    totalRevenue: Number(monthlyTotals[0]?.totalRevenue || 0),
    dailyEvolution,
    barberRanking,
  };
}
