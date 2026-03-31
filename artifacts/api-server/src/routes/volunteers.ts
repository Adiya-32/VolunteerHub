import { Router, type IRouter } from "express";
import { db, volunteersTable, pendingActionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const ADMIN_EMAIL = "mikoplan23@gmail.com";

const router: IRouter = Router();

const createVolunteerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  skills: z.array(z.string()).min(1),
  availability: z.enum(["weekdays", "weekends", "evenings", "flexible"]),
  location: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
});

router.get("/volunteers", async (req, res) => {
  try {
    const volunteers = await db.select().from(volunteersTable).orderBy(volunteersTable.createdAt);
    res.json(volunteers.map(v => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list volunteers");
    res.status(500).json({ error: "Failed to list volunteers" });
  }
});

router.post("/volunteers", async (req, res) => {
  try {
    const data = createVolunteerSchema.parse(req.body);
    const [volunteer] = await db.insert(volunteersTable).values({
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      skills: data.skills,
      availability: data.availability,
      location: data.location ?? null,
      bio: data.bio ?? null,
    }).returning();
    res.status(201).json({
      ...volunteer,
      createdAt: volunteer.createdAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.message });
      return;
    }
    req.log.error({ err }, "Failed to create volunteer");
    res.status(500).json({ error: "Failed to create volunteer" });
  }
});

router.get("/volunteers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [volunteer] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, id));
    if (!volunteer) {
      res.status(404).json({ error: "Volunteer not found" });
      return;
    }
    res.json({ ...volunteer, createdAt: volunteer.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to get volunteer");
    res.status(500).json({ error: "Failed to get volunteer" });
  }
});

router.put("/volunteers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = createVolunteerSchema.parse(req.body);
    const [volunteer] = await db.update(volunteersTable)
      .set({
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        skills: data.skills,
        availability: data.availability,
        location: data.location ?? null,
        bio: data.bio ?? null,
      })
      .where(eq(volunteersTable.id, id))
      .returning();
    if (!volunteer) {
      res.status(404).json({ error: "Volunteer not found" });
      return;
    }
    res.json({ ...volunteer, createdAt: volunteer.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update volunteer");
    res.status(500).json({ error: "Failed to update volunteer" });
  }
});

// Admin-only: direct delete
router.delete("/volunteers/:id", async (req, res) => {
  const userEmail = req.session?.userEmail;
  if (!userEmail) {
    res.status(401).json({ error: "Жүйеге кіру қажет." });
    return;
  }
  if (userEmail !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Тек әкімші жоя алады." });
    return;
  }
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(volunteersTable).where(eq(volunteersTable.id, id)).returning();
    if (!deleted) {
      res.status(404).json({ error: "Volunteer not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete volunteer");
    res.status(500).json({ error: "Failed to delete volunteer" });
  }
});

// Non-admin: request delete (creates a pending action)
router.post("/volunteers/:id/request-action", async (req, res) => {
  const userEmail = req.session?.userEmail;
  const userName = req.session?.userName ?? "Белгісіз пайдаланушы";
  if (!userEmail) {
    res.status(401).json({ error: "Жүйеге кіру қажет." });
    return;
  }
  try {
    const id = parseInt(req.params.id);
    const { actionType } = z.object({ actionType: z.string() }).parse(req.body);
    const [volunteer] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, id));
    if (!volunteer) {
      res.status(404).json({ error: "Еріктілер табылмады" });
      return;
    }
    // Check for duplicate pending action
    const existing = await db.select().from(pendingActionsTable)
      .where(eq(pendingActionsTable.targetId, String(id)));
    const dupe = existing.find(a => a.status === "pending" && a.actionType === actionType && a.requestedByEmail === userEmail);
    if (dupe) {
      res.status(409).json({ error: "Бұл сұраныс бұрыннан жіберілген." });
      return;
    }
    const [action] = await db.insert(pendingActionsTable).values({
      actionType,
      targetId: String(id),
      targetName: volunteer.name,
      requestedByEmail: userEmail,
      requestedByName: userName,
      status: "pending",
    }).returning();
    res.status(201).json({ ...action, createdAt: action.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to create pending action");
    res.status(500).json({ error: "Сұраныс жіберу мүмкін болмады." });
  }
});

// Pending actions - list (admin only)
router.get("/pending-actions", async (req, res) => {
  const userEmail = req.session?.userEmail;
  if (!userEmail || userEmail !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Тек әкімші үшін." });
    return;
  }
  try {
    const actions = await db.select().from(pendingActionsTable).orderBy(pendingActionsTable.createdAt);
    res.json(actions.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to list pending actions");
    res.status(500).json({ error: "Failed to list pending actions" });
  }
});

// Approve or deny a pending action (admin only)
router.patch("/pending-actions/:id", async (req, res) => {
  const userEmail = req.session?.userEmail;
  if (!userEmail || userEmail !== ADMIN_EMAIL) {
    res.status(403).json({ error: "Тек әкімші үшін." });
    return;
  }
  try {
    const id = parseInt(req.params.id);
    const { decision } = z.object({ decision: z.enum(["approved", "denied"]) }).parse(req.body);
    const [action] = await db.select().from(pendingActionsTable).where(eq(pendingActionsTable.id, id));
    if (!action) {
      res.status(404).json({ error: "Сұраныс табылмады" });
      return;
    }

    // If approved delete action, actually delete the volunteer
    if (decision === "approved" && action.actionType === "delete_volunteer") {
      await db.delete(volunteersTable).where(eq(volunteersTable.id, parseInt(action.targetId)));
    }

    const [updated] = await db.update(pendingActionsTable)
      .set({ status: decision })
      .where(eq(pendingActionsTable.id, id))
      .returning();
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to update pending action");
    res.status(500).json({ error: "Failed to update pending action" });
  }
});

export default router;
