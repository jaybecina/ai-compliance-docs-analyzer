import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { getAuthDb } from "../services/authDb.service";

const RoleSchema = z.enum(["admin", "analyst", "demo"]);

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(200),
  name: z.string().min(1).max(100).optional(),
  role: RoleSchema.optional(),
});

function signToken(user: { id: string; username: string; role: string }) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    secret,
    { expiresIn: "7d" }
  );
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const { username, password } = parsed.data;
    const { db } = getAuthDb();

    const user = db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        role: users.role,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Login failed" });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid registration payload" });
    }

    const { username, password, name, role } = parsed.data;
    const finalRole = role ?? "demo";

    const { db } = getAuthDb();
    const existing = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existing?.id) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    const id = `user_${username}_${Date.now()}`;

    db.insert(users)
      .values({
        id,
        username,
        name: name ?? username,
        role: finalRole,
        passwordHash,
        createdAtMs: Date.now(),
      })
      .run();

    const token = signToken({ id, username, role: finalRole });
    res.status(201).json({
      message: "Registration successful",
      user: { id, username, name: name ?? username, role: finalRole },
      token,
    });
  } catch (error) {
    console.error("Error during register:", error);
    res.status(500).json({ error: "Registration failed" });
  }
}
