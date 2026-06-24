import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, departmentsTable, membersTable } from "@workspace/db";
import {
  CreateDepartmentBody,
  UpdateDepartmentParams,
  UpdateDepartmentBody,
  DeleteDepartmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/departments", async (_req, res): Promise<void> => {
  const departments = await db
    .select({
      id: departmentsTable.id,
      name: departmentsTable.name,
      description: departmentsTable.description,
      color: departmentsTable.color,
      discordRoleId: departmentsTable.discordRoleId,
      leaderId: departmentsTable.leaderId,
      memberCount: sql<number>`COUNT(${membersTable.id})`,
    })
    .from(departmentsTable)
    .leftJoin(membersTable, eq(membersTable.departmentId, departmentsTable.id))
    .groupBy(departmentsTable.id)
    .orderBy(departmentsTable.name);

  const leaderIds = departments.filter((d) => d.leaderId).map((d) => d.leaderId!);
  let leaderMap: Record<number, string> = {};
  if (leaderIds.length > 0) {
    const leaders = await db
      .select({ id: membersTable.id, name: membersTable.discordUsername })
      .from(membersTable)
      .where(sql`${membersTable.id} = ANY(${leaderIds})`);
    for (const l of leaders) leaderMap[l.id] = l.name;
  }

  res.json(
    departments.map((d) => ({
      ...d,
      memberCount: Number(d.memberCount),
      leaderName: d.leaderId ? leaderMap[d.leaderId] ?? null : null,
    }))
  );
});

router.post("/departments", async (req, res): Promise<void> => {
  const parsed = CreateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [dept] = await db.insert(departmentsTable).values(parsed.data).returning();
  res.status(201).json({ ...dept, memberCount: 0, leaderName: null });
});

router.patch("/departments/:id", async (req, res): Promise<void> => {
  const params = UpdateDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDepartmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(departmentsTable)
    .set(parsed.data)
    .where(eq(departmentsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  res.json({ ...updated, memberCount: 0, leaderName: null });
});

router.delete("/departments/:id", async (req, res): Promise<void> => {
  const params = DeleteDepartmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(departmentsTable)
    .where(eq(departmentsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Department not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
