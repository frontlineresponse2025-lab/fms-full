import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, whitelistTable } from "@workspace/db";
import {
  ListWhitelistQueryParams,
  CreateWhitelistEntryBody,
  UpdateWhitelistEntryParams,
  UpdateWhitelistEntryBody,
  DeleteWhitelistEntryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/whitelist", async (req, res): Promise<void> => {
  const query = ListWhitelistQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, search } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(whitelistTable.status, status));
  if (search) conditions.push(ilike(whitelistTable.discordId, `%${search}%`));

  const entries = await db
    .select()
    .from(whitelistTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(whitelistTable.addedAt);

  res.json(entries.map((e) => ({ ...e, addedAt: e.addedAt.toISOString() })));
});

router.post("/whitelist", async (req, res): Promise<void> => {
  const parsed = CreateWhitelistEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(whitelistTable).values(parsed.data).returning();
  res.status(201).json({ ...entry, addedAt: entry.addedAt.toISOString() });
});

router.patch("/whitelist/:id", async (req, res): Promise<void> => {
  const params = UpdateWhitelistEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateWhitelistEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(whitelistTable)
    .set(parsed.data)
    .where(eq(whitelistTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Whitelist entry not found" });
    return;
  }

  res.json({ ...updated, addedAt: updated.addedAt.toISOString() });
});

router.delete("/whitelist/:id", async (req, res): Promise<void> => {
  const params = DeleteWhitelistEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(whitelistTable)
    .where(eq(whitelistTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Whitelist entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
