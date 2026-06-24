import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, ranksTable, membersTable } from "@workspace/db";
import {
  CreateRankBody,
  UpdateRankParams,
  UpdateRankBody,
  DeleteRankParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ranks", async (_req, res): Promise<void> => {
  const ranks = await db
    .select({
      id: ranksTable.id,
      name: ranksTable.name,
      level: ranksTable.level,
      description: ranksTable.description,
      color: ranksTable.color,
      discordRoleId: ranksTable.discordRoleId,
      memberCount: sql<number>`COUNT(${membersTable.id})`,
    })
    .from(ranksTable)
    .leftJoin(membersTable, eq(membersTable.rankId, ranksTable.id))
    .groupBy(ranksTable.id)
    .orderBy(ranksTable.level);

  res.json(ranks.map((r) => ({ ...r, memberCount: Number(r.memberCount) })));
});

router.post("/ranks", async (req, res): Promise<void> => {
  const parsed = CreateRankBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rank] = await db.insert(ranksTable).values(parsed.data).returning();
  res.status(201).json({ ...rank, memberCount: 0 });
});

router.patch("/ranks/:id", async (req, res): Promise<void> => {
  const params = UpdateRankParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRankBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(ranksTable)
    .set(parsed.data)
    .where(eq(ranksTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Rank not found" });
    return;
  }

  res.json({ ...updated, memberCount: 0 });
});

router.delete("/ranks/:id", async (req, res): Promise<void> => {
  const params = DeleteRankParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(ranksTable).where(eq(ranksTable.id, params.data.id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Rank not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
