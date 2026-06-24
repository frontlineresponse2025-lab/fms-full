import { Router, type IRouter } from "express";
import { eq, gte, lte, sql, and, desc } from "drizzle-orm";
import { db, patrolLogsTable, membersTable, ranksTable, departmentsTable } from "@workspace/db";
import { ListActivityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/activity", async (req, res): Promise<void> => {
  const query = ListActivityQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { memberId, startDate, endDate } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (memberId) conditions.push(eq(patrolLogsTable.memberId, memberId));
  if (startDate) conditions.push(gte(patrolLogsTable.startTime, new Date(startDate)));
  if (endDate) conditions.push(lte(patrolLogsTable.startTime, new Date(endDate)));

  const activity = await db
    .select({
      memberId: membersTable.id,
      memberName: membersTable.discordUsername,
      rankName: ranksTable.name,
      departmentName: departmentsTable.name,
      totalMinutes: sql<number>`COALESCE(SUM(${patrolLogsTable.durationMinutes}), 0)`,
      patrolCount: sql<number>`COUNT(${patrolLogsTable.id})`,
      lastPatrol: sql<string | null>`MAX(${patrolLogsTable.startTime})`,
    })
    .from(membersTable)
    .leftJoin(
      patrolLogsTable,
      and(
        eq(patrolLogsTable.memberId, membersTable.id),
        ...conditions
      )
    )
    .leftJoin(ranksTable, eq(membersTable.rankId, ranksTable.id))
    .leftJoin(departmentsTable, eq(membersTable.departmentId, departmentsTable.id))
    .groupBy(membersTable.id, ranksTable.name, departmentsTable.name)
    .orderBy(desc(sql`SUM(${patrolLogsTable.durationMinutes})`));

  res.json(
    activity.map((a) => ({
      memberId: a.memberId,
      memberName: a.memberName,
      rankName: a.rankName ?? null,
      departmentName: a.departmentName ?? null,
      totalPatrolHours: Number(a.totalMinutes) / 60,
      patrolCount: Number(a.patrolCount),
      lastPatrol: a.lastPatrol ? new Date(a.lastPatrol).toISOString() : null,
    }))
  );
});

router.get("/activity/leaderboard", async (_req, res): Promise<void> => {
  const leaderboard = await db
    .select({
      memberId: membersTable.id,
      memberName: membersTable.discordUsername,
      rankName: ranksTable.name,
      departmentName: departmentsTable.name,
      totalMinutes: sql<number>`COALESCE(SUM(${patrolLogsTable.durationMinutes}), 0)`,
      patrolCount: sql<number>`COUNT(${patrolLogsTable.id})`,
      lastPatrol: sql<string | null>`MAX(${patrolLogsTable.startTime})`,
    })
    .from(membersTable)
    .leftJoin(patrolLogsTable, eq(patrolLogsTable.memberId, membersTable.id))
    .leftJoin(ranksTable, eq(membersTable.rankId, ranksTable.id))
    .leftJoin(departmentsTable, eq(membersTable.departmentId, departmentsTable.id))
    .groupBy(membersTable.id, ranksTable.name, departmentsTable.name)
    .orderBy(desc(sql`SUM(${patrolLogsTable.durationMinutes})`))
    .limit(10);

  res.json(
    leaderboard.map((a) => ({
      memberId: a.memberId,
      memberName: a.memberName,
      rankName: a.rankName ?? null,
      departmentName: a.departmentName ?? null,
      totalPatrolHours: Number(a.totalMinutes) / 60,
      patrolCount: Number(a.patrolCount),
      lastPatrol: a.lastPatrol ? new Date(a.lastPatrol).toISOString() : null,
    }))
  );
});

export default router;
