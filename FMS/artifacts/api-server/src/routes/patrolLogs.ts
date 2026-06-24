import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, patrolLogsTable, membersTable } from "@workspace/db";
import {
  ListPatrolLogsQueryParams,
  CreatePatrolLogBody,
  UpdatePatrolLogParams,
  UpdatePatrolLogBody,
  DeletePatrolLogParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/patrol-logs", async (req, res): Promise<void> => {
  const query = ListPatrolLogsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { memberId, startDate, endDate } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (memberId) conditions.push(eq(patrolLogsTable.memberId, memberId));
  if (startDate) conditions.push(gte(patrolLogsTable.startTime, new Date(startDate)));
  if (endDate) conditions.push(lte(patrolLogsTable.startTime, new Date(endDate)));

  const logs = await db
    .select({
      id: patrolLogsTable.id,
      memberId: patrolLogsTable.memberId,
      memberName: membersTable.discordUsername,
      startTime: patrolLogsTable.startTime,
      endTime: patrolLogsTable.endTime,
      durationMinutes: patrolLogsTable.durationMinutes,
      server: patrolLogsTable.server,
      notes: patrolLogsTable.notes,
      createdAt: patrolLogsTable.createdAt,
    })
    .from(patrolLogsTable)
    .leftJoin(membersTable, eq(patrolLogsTable.memberId, membersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(patrolLogsTable.startTime);

  res.json(
    logs.map((l) => ({
      ...l,
      startTime: l.startTime.toISOString(),
      endTime: l.endTime?.toISOString() ?? null,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

router.post("/patrol-logs", async (req, res): Promise<void> => {
  const parsed = CreatePatrolLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = {
    ...parsed.data,
    startTime: new Date(parsed.data.startTime),
    endTime: parsed.data.endTime ? new Date(parsed.data.endTime) : undefined,
  };

  const [log] = await db.insert(patrolLogsTable).values(data).returning();

  res.status(201).json({
    ...log,
    memberName: null,
    startTime: log.startTime.toISOString(),
    endTime: log.endTime?.toISOString() ?? null,
    createdAt: log.createdAt.toISOString(),
  });
});

router.patch("/patrol-logs/:id", async (req, res): Promise<void> => {
  const params = UpdatePatrolLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePatrolLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startTime) updateData.startTime = new Date(parsed.data.startTime);
  if (parsed.data.endTime) updateData.endTime = new Date(parsed.data.endTime);

  const [updated] = await db
    .update(patrolLogsTable)
    .set(updateData)
    .where(eq(patrolLogsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Patrol log not found" });
    return;
  }

  res.json({
    ...updated,
    memberName: null,
    startTime: updated.startTime.toISOString(),
    endTime: updated.endTime?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/patrol-logs/:id", async (req, res): Promise<void> => {
  const params = DeletePatrolLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(patrolLogsTable)
    .where(eq(patrolLogsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Patrol log not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
