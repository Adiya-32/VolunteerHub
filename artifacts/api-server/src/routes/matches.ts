import { Router, type IRouter } from "express";
import { db, matchesTable, volunteersTable, tasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

function calculateMatchScore(volunteerSkills: string[], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 50;
  const matchingSkills = volunteerSkills.filter(skill =>
    requiredSkills.some(req => req.toLowerCase() === skill.toLowerCase())
  );
  return Math.round((matchingSkills.length / requiredSkills.length) * 100);
}

router.get("/tasks/:id/matches", async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const volunteers = await db.select().from(volunteersTable);
    const existingMatches = await db.select().from(matchesTable).where(eq(matchesTable.taskId, taskId));
    const matchedVolunteerIds = new Set(existingMatches.map(m => m.volunteerId));

    const results = volunteers.map(volunteer => {
      const matchingSkills = volunteer.skills.filter(skill =>
        task.requiredSkills.some(req => req.toLowerCase() === skill.toLowerCase())
      );
      const matchScore = calculateMatchScore(volunteer.skills, task.requiredSkills);
      return {
        volunteer: { ...volunteer, createdAt: volunteer.createdAt.toISOString() },
        matchScore,
        matchingSkills,
        alreadyMatched: matchedVolunteerIds.has(volunteer.id),
      };
    });

    results.sort((a, b) => b.matchScore - a.matchScore);
    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to get matches");
    res.status(500).json({ error: "Failed to get matches" });
  }
});

router.get("/matches", async (req, res) => {
  try {
    const matches = await db.select().from(matchesTable).orderBy(matchesTable.createdAt);
    const enriched = await Promise.all(matches.map(async match => {
      const [volunteer] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, match.volunteerId));
      const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, match.taskId));
      return {
        ...match,
        volunteerName: volunteer?.name ?? "Unknown",
        taskTitle: task?.title ?? "Unknown",
        createdAt: match.createdAt.toISOString(),
      };
    }));
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to list matches");
    res.status(500).json({ error: "Failed to list matches" });
  }
});

router.post("/matches", async (req, res) => {
  try {
    const { taskId, volunteerId } = z.object({
      taskId: z.number().int(),
      volunteerId: z.number().int(),
    }).parse(req.body);

    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId));
    const [volunteer] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, volunteerId));

    if (!task || !volunteer) {
      res.status(404).json({ error: "Task or volunteer not found" });
      return;
    }

    const matchScore = calculateMatchScore(volunteer.skills, task.requiredSkills);

    const [match] = await db.insert(matchesTable).values({
      taskId,
      volunteerId,
      matchScore,
      status: "pending",
    }).returning();

    res.status(201).json({
      ...match,
      volunteerName: volunteer.name,
      taskTitle: task.title,
      createdAt: match.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create match");
    res.status(500).json({ error: "Failed to create match" });
  }
});

export default router;
