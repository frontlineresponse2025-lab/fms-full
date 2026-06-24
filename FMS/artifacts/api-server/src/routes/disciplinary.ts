import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, disciplinaryTable, membersTable } from "@workspace/db";
import {
  ListDisciplinaryQueryParams,
  CreateDisciplinaryBody,
  UpdateDisciplinaryParams,
  UpdateDisciplinaryBody,
  DeleteDisciplinaryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/disciplinary", async (req, res): Promise<void> => {
  const query = ListDisciplinaryQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { memberId, type } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (memberId) conditions.push(eq(disciplinaryTable.memberId, memberId));
  if (type) conditions.push(eq(disciplinaryTable.type, type));

  const records = await db
    .select({
      id: disciplinaryTable.id,
      memberId: disciplinaryTable.memberId,
      memberName: membersTable.discordUsername,
      type: disciplinaryTable.type,
      reason: disciplinaryTable.reason,
      issuedBy: disciplinaryTable.issuedBy,
      issuedAt: disciplinaryTable.issuedAt,
      expiresAt: disciplinaryTable.expiresAt,
      notes: disciplinaryTable.notes,
      active: disciplinaryTable.active,
    })
    .from(disciplinaryTable)
    .leftJoin(membersTable, eq(disciplinaryTable.memberId, membersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(disciplinaryTable.issuedAt);

  res.json(
    records.map((r) => ({
      ...r,
      issuedAt: r.issuedAt.toISOString(),
      expiresAt: r.expiresAt?.toISOString() ?? null,
    }))
  );
});

router.post("/disciplinary", async (req, res): Promise<void> => {
  const parsed = CreateDisciplinaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = {
    ...parsed.data,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
  };

  const [record] = await db.insert(disciplinaryTable).values(data).returning();

  res.status(201).json({
    ...record,
    memberName: null,
    issuedAt: record.issuedAt.toISOString(),
    expiresAt: record.expiresAt?.toISOString() ?? null,
  });
});

router.patch("/disciplinary/:id", async (req, res): Promise<void> => {
  const params = UpdateDisciplinaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDisciplinaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.expiresAt) updateData.expiresAt = new Date(parsed.data.expiresAt);

  const [updated] = await db
    .update(disciplinaryTable)
    .set(updateData)
    .where(eq(disciplinaryTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  res.json({
    ...updated,
    memberName: null,
    issuedAt: updated.issuedAt.toISOString(),
    expiresAt: updated.expiresAt?.toISOString() ?? null,
  });
});

router.delete("/disciplinary/:id", async (req, res): Promise<void> => {
  const params = DeleteDisciplinaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(disciplinaryTable)
    .where(eq(disciplinaryTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
