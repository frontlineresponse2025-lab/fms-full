import { Router, type IRouter } from "express";
import { sql, eq, desc } from "drizzle-orm";
import {
  db,
  membersTable,
  applicationsTable,
  patrolLogsTable,
  careersTable,
  whitelistTable,
  departmentsTable,
  ranksTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const [memberStats] = await db
    .select({
      totalMembers: sql<number>`COUNT(*)`,
      activeMembers: sql<number>`COUNT(*) FILTER (WHERE ${membersTable.status} = 'active')`,
      suspendedMembers: sql<number>`COUNT(*) FILTER (WHERE ${membersTable.status} = 'suspended')`,
    })
    .from(membersTable);

  const [applicationStats] = await db
    .select({
      pendingApplications: sql<number>`COUNT(*) FILTER (WHERE ${applicationsTable.status} = 'pending')`,
    })
    .from(applicationsTable);

  const [patrolStats] = await db
    .select({
      totalMinutes: sql<number>`COALESCE(SUM(${patrolLogsTable.durationMinutes}), 0)`,
    })
    .from(patrolLogsTable);

  const [careerStats] = await db
    .select({
      openPositions: sql<number>`COUNT(*) FILTER (WHERE ${careersTable.isOpen} = true)`,
    })
    .from(careersTable);

  const [whitelistStats] = await db
    .select({
      whitelistedCount: sql<number>`COUNT(*) FILTER (WHERE ${whitelistTable.status} = 'approved')`,
    })
    .from(whitelistTable);

  const deptBreakdown = await db
    .select({
      name: departmentsTable.name,
      count: sql<number>`COUNT(${membersTable.id})`,
    })
    .from(departmentsTable)
    .leftJoin(membersTable, eq(membersTable.departmentId, departmentsTable.id))
    .groupBy(departmentsTable.name)
    .orderBy(desc(sql`COUNT(${membersTable.id})`));

  const recentActivity = await db
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
    .limit(5);

  res.json({
    totalMembers: Number(memberStats?.totalMembers ?? 0),
    activeMembers: Number(memberStats?.activeMembers ?? 0),
    suspendedMembers: Number(memberStats?.suspendedMembers ?? 0),
    pendingApplications: Number(applicationStats?.pendingApplications ?? 0),
    totalPatrolHours: Number(patrolStats?.totalMinutes ?? 0) / 60,
    openPositions: Number(careerStats?.openPositions ?? 0),
    whitelistedCount: Number(whitelistStats?.whitelistedCount ?? 0),
    departmentBreakdown: deptBreakdown.map((d) => ({
      name: d.name,
      count: Number(d.count),
    })),
    recentActivity: recentActivity.map((a) => ({
      memberId: a.memberId,
      memberName: a.memberName,
      rankName: a.rankName ?? null,
      departmentName: a.departmentName ?? null,
      totalPatrolHours: Number(a.totalMinutes) / 60,
      patrolCount: Number(a.patrolCount),
      lastPatrol: a.lastPatrol ? new Date(a.lastPatrol).toISOString() : null,
    })),
  });
});

router.get("/stats/patrol-summary", async (_req, res): Promise<void> => {
  const summary = await db
    .select({
      memberId: membersTable.id,
      memberName: membersTable.discordUsername,
      totalMinutes: sql<number>`COALESCE(SUM(${patrolLogsTable.durationMinutes}), 0)`,
      patrolCount: sql<number>`COUNT(${patrolLogsTable.id})`,
      lastPatrol: sql<string | null>`MAX(${patrolLogsTable.startTime})`,
    })
    .from(membersTable)
    .leftJoin(patrolLogsTable, eq(patrolLogsTable.memberId, membersTable.id))
    .groupBy(membersTable.id)
    .orderBy(desc(sql`SUM(${patrolLogsTable.durationMinutes})`));

  res.json(
    summary.map((s) => ({
      memberId: s.memberId,
      memberName: s.memberName,
      totalHours: Number(s.totalMinutes) / 60,
      patrolCount: Number(s.patrolCount),
      lastPatrol: s.lastPatrol ? new Date(s.lastPatrol).toISOString() : null,
    }))
  );
});

export default router;
