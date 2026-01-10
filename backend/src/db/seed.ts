import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "./schema";
import type { DrizzleDb } from "./index";
import { z } from "zod";

export type SeedUser = {
  username: string;
  password: string;
  name: string;
  role: "admin" | "analyst" | "demo";
};

const SeedUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["admin", "analyst", "demo"]),
});

const SeedUsersSchema = z.array(SeedUserSchema).min(1);

export function seedUsers(db: DrizzleDb, seedUsers: SeedUser[]) {
  const now = Date.now();

  for (const u of seedUsers) {
    const existing = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, u.username))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get?.() as any;

    if (existing?.id) continue;

    const passwordHash = bcrypt.hashSync(u.password, 12);

    db.insert(users)
      .values({
        id: `user_${u.username}`,
        username: u.username,
        name: u.name,
        role: u.role,
        passwordHash,
        createdAtMs: now,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .run?.();
  }
}

export function seedUsersFromEnv(db: DrizzleDb) {
  const raw = process.env.SEED_USERS_JSON;
  if (!raw || !raw.trim()) return;

  const parsedJson = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();

  const parsed = SeedUsersSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(
      "Invalid SEED_USERS_JSON. Expected JSON array of {username,password,name,role}."
    );
  }

  seedUsers(db, parsed.data);
}
