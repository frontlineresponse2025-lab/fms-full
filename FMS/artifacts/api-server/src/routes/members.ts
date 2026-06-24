import { Router, type IRouter } from "express";
import { eq, sql, ilike, or, and } from "drizzle-orm";
import { db, membersTable, ranksTable, departmentsTable, patrolLogsTable } from "@workspace/db";
import {
  ListMembersQueryParams,
  CreateMemberBody,
  GetMemberParams,
  UpdateMemberParams,
  UpdateMemberBody,
  DeleteMemberParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import { syncDiscordRole, type FmsRole } from "../lib/discord";

const router: IRouter = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

/** Maps an FMS rank name to the four-tier FmsRole used for Discord sync.
 *  Adjust the keyword matching to fit your actual rank names. */
function rankNameToFmsRole(rankName: string | null): FmsRole {
  if (!rankName) return "RECRUIT";
  const n = rankName.toUpperCase();
  if (n.includes("ADMIN") || n.includes("CHIEF") || n.includes("COMMISSIONER")) return "SYSTEM.ADMIN";
  if (n.includes("SUPERVISOR") || n.includes("CAPTAIN") || n.includes("LT")) return "SUPERVISOR";
  if (n.includes("OFFICER") || n.includes("DEPUTY") || n.includes("TROOPER")) return "OFFICER";
  return "RECRUIT";
}

// ── Routes ─────────────────────────────────────────────────────────────────

router.get("/members", requireAuth, async (req, res): Promise<void> => {
  const query = ListMembersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { departmentId, rankId, status, search } = query.data;

  const conditions: ReturnType<typeof eq>[] = [];
  if (departmentId) conditions.push(eq(membersTable.departmentId, departmentId));
  if (rankId) conditions.push(eq(membersTable.rankId, rankId));
  if (status) conditions.push(eq(membersTable.status, status));
  if (search) {
    conditions.push(
      or(
        ilike(membersTable.discordUsername, `%${search}%`),
        ilike(membersTable.callsign, `%${search}%`),
        ilike(membersTable.characterName, `%${search}%`),
      ) as ReturnType<typeof eq>,
    );
  }

  const members = await db
    .select({
      id: membersTable.id,
      discordId: membersTable.discordId,
      discordUsername: membersTable.discordUsername,
      callsign: membersTable.callsign,
      characterName: membersTable.characterName,
      rankId: membersTable.rankId,
      rankName: ranksTable.name,
      departmentId: membersTable.departmentId,
      departmentName: departmentsTable.name,
      status: membersTable.status,
      notes: membersTable.notes,
      joinedAt: membersTable.joinedAt,
    })
    .from(membersTable)
    .leftJoin(ranksTable, eq(membersTable.rankId, ranksTable.id))
    .leftJoin(departmentsTable, eq(membersTable.departmentId, departmentsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(membersTable.joinedAt);

  const memberIds = members.map((m) => m.id);
  let patrolHoursMap: Record<number, number> = {};
  if (memberIds.length > 0) {
    const hours = await db
      .select({
        memberId: patrolLogsTable.memberId,
        totalMinutes: sql<number>`COALESCE(SUM(${patrolLogsTable.durationMinutes}), 0)`,
      })
      .from(patrolLogsTable)
      .groupBy(patrolLogsTable.memberId);
    for (const h of hours) {
      patrolHoursMap[h.memberId] = Number(h.totalMinutes) / 60;
    }
  }

  res.json(members.map((m) => ({ ...m, joinedAt: m.joinedAt.toISOString(), totalPatrolHours: patrolHoursMap[m.id] ?? 0 })));
});

router.post("/members", requireRole("SYSTEM.ADMIN", "SUPERVISOR"), async (req, res): Promise<void> => {
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db.insert(membersTable).values(parsed.data).returning();

  res.status(201).json({
    ...member,
    rankName: null,
    departmentName: null,
    joinedAt: member.joinedAt.toISOString(),
    totalPatrolHours: 0,
  });
});

router.get("/members/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [member] = await db
    .select({
      id: membersTable.id,
      discordId: membersTable.discordId,
      discordUsername: membersTable.discordUsername,
      callsign: membersTable.callsign,
      characterName: membersTable.characterName,
      rankId: membersTable.rankId,
      rankName: ranksTable.name,
      departmentId: membersTable.departmentId,
      departmentName: departmentsTable.name,
      status: membersTable.status,
      notes: membersTable.notes,
      joinedAt: membersTable.joinedAt,
    })
    .from(membersTable)
    .leftJoin(ranksTable, eq(membersTable.rankId, ranksTable.id))
    .leftJoin(departmentsTable, eq(membersTable.departmentId, departmentsTable.id))
    .where(eq(membersTable.id, params.data.id));

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const [patrol] = await db
    .select({ totalMinutes: sql<number>`COALESCE(SUM(${patrolLogsTable.durationMinutes}), 0)` })
    .from(patrolLogsTable)
    .where(eq(patrolLogsTable.memberId, params.data.id));

  res.json({ ...member, joinedAt: member.joinedAt.toISOString(), totalPatrolHours: Number(patrol?.totalMinutes ?? 0) / 60 });
});

router.patch("/members/:id", requireRole("SYSTEM.ADMIN", "SUPERVISOR"), async (req, res): Promise<void> => {
  const params = UpdateMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.update(membersTable).set(parsed.data).where(eq(membersTable.id, params.data.id));

  // Re-fetch with joins so the response has accurate rankName / departmentName
  const [updated] = await db
    .select({
      id: membersTable.id,
      discordId: membersTable.discordId,
      discordUsername: membersTable.discordUsername,
      callsign: membersTable.callsign,
      characterName: membersTable.characterName,
      rankId: membersTable.rankId,
      rankName: ranksTable.name,
      departmentId: membersTable.departmentId,
      departmentName: departmentsTable.name,
      status: membersTable.status,
      notes: membersTable.notes,
      joinedAt: membersTable.joinedAt,
    })
    .from(membersTable)
    .leftJoin(ranksTable, eq(membersTable.rankId, ranksTable.id))
    .leftJoin(departmentsTable, eq(membersTable.departmentId, departmentsTable.id))
    .where(eq(membersTable.id, params.data.id));

  if (!updated) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  // ── Discord role sync ──────────────────────────────────────────────────
  // If the rank changed and the member has a Discord ID, sync their role.
  if (parsed.data.rankId !== undefined && updated.discordId) {
    const fmsRole = rankNameToFmsRole(updated.rankName ?? null);
    // Fire-and-forget — don't block the HTTP response on Discord API
    syncDiscordRole(updated.discordId, fmsRole).catch((err) =>
      console.error(`syncDiscordRole failed for member ${updated.id}:`, err),
    );
  }

  const [patrol] = await db
    .select({ totalMinutes: sql<number>`COALESCE(SUM(${patrolLogsTable.durationMinutes}), 0)` })
    .from(patrolLogsTable)
    .where(eq(patrolLogsTable.memberId, params.data.id));

  res.json({ ...updated, joinedAt: updated.joinedAt.toISOString(), totalPatrolHours: Number(patrol?.totalMinutes ?? 0) / 60 });
});

router.delete("/members/:id", requireRole("SYSTEM.ADMIN"), async (req, res): Promise<void> => {
  const params = DeleteMemberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(membersTable).where(eq(membersTable.id, params.data.id)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
