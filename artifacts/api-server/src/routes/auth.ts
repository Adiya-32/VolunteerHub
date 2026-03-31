import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: number;
    userEmail: string;
    userName: string;
  }
}

const router: IRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) {
      res.status(409).json({ error: "Бұл электрондық пошта бұрыннан тіркелген." });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email, password: hashed }).returning();

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;

    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Жарамсыз деректер." });
      return;
    }
    req.log.error({ err }, "Signup failed");
    res.status(500).json({ error: "Тіркелу кезінде қате пайда болды." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      res.status(401).json({ error: "Электрондық пошта немесе құпиясөз қате." });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Электрондық пошта немесе құпиясөз қате." });
      return;
    }

    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;

    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Жарамсыз деректер." });
      return;
    }
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Кіру кезінде қате пайда болды." });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Кірілмеген." });
    return;
  }
  res.json({
    id: req.session.userId,
    email: req.session.userEmail,
    name: req.session.userName,
  });
});

export default router;
