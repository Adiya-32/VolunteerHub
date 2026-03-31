import { Router, type IRouter } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requiredSkills: z.array(z.string()),
  location: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  duration: z.number().int().positive().nullable().optional(),
  volunteersNeeded: z.number().int().positive().default(1),
  coordinatorName: z.string().min(1),
});

router.get("/tasks", async (req, res) => {
  try {
    const { status } = req.query;
    let tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
    if (status && typeof status === "string") {
      tasks = tasks.filter(t => t.status === status);
    }
    res.json(tasks.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Failed to list tasks" });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const [task] = await db.insert(tasksTable).values({
      title: data.title,
      description: data.description,
      requiredSkills: data.requiredSkills,
      location: data.location ?? null,
      date: data.date ?? null,
      duration: data.duration ?? null,
      volunteersNeeded: data.volunteersNeeded,
      coordinatorName: data.coordinatorName,
      status: "open",
    }).returning();
    res.status(201).json({ ...task, createdAt: task.createdAt.toISOString() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.message });
      return;
    }
    req.log.error({ err }, "Failed to create task");
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.get("/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, id));
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({ ...task, createdAt: task.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get task");
    res.status(500).json({ error: "Failed to get task" });
  }
});

router.patch("/tasks/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = z.object({ status: z.enum(["open", "in_progress", "completed", "cancelled"]) }).parse(req.body);
    const [task] = await db.update(tasksTable)
      .set({ status })
      .where(eq(tasksTable.id, id))
      .returning();
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json({ ...task, createdAt: task.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(500).json({ error: "Failed to update task" });
  }
});

export default router;
