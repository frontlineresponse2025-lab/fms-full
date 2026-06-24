import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, applicationsTable, careersTable } from "@workspace/db";
import {
  ListApplicationsQueryParams,
  CreateApplicationBody,
  GetApplicationParams,
  UpdateApplicationParams,
  UpdateApplicationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/applications", async (req, res): Promise<void> => {
  const query = ListApplicationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status, type } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(applicationsTable.status, status));
  if (type) conditions.push(eq(applicationsTable.type, type));

  const apps = await db
    .select({
      id: applicationsTable.id,
      applicantName: applicationsTable.applicantName,
      discordId: applicationsTable.discordId,
      discordUsername: applicationsTable.discordUsername,
      type: applicationsTable.type,
      careerId: applicationsTable.careerId,
      careerTitle: careersTable.title,
      status: applicationsTable.status,
      answers: applicationsTable.answers,
      reviewedBy: applicationsTable.reviewedBy,
      reviewNotes: applicationsTable.reviewNotes,
      submittedAt: applicationsTable.submittedAt,
      reviewedAt: applicationsTable.reviewedAt,
    })
    .from(applicationsTable)
    .leftJoin(careersTable, eq(applicationsTable.careerId, careersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(applicationsTable.submittedAt);

  res.json(
    apps.map((a) => ({
      ...a,
      submittedAt: a.submittedAt.toISOString(),
      reviewedAt: a.reviewedAt?.toISOString() ?? null,
    }))
  );
});

router.post("/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [app] = await db.insert(applicationsTable).values(parsed.data).returning();

  res.status(201).json({
    ...app,
    careerTitle: null,
    submittedAt: app.submittedAt.toISOString(),
    reviewedAt: app.reviewedAt?.toISOString() ?? null,
  });
});

router.get("/applications/:id", async (req, res): Promise<void> => {
  const params = GetApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [app] = await db
    .select({
      id: applicationsTable.id,
      applicantName: applicationsTable.applicantName,
      discordId: applicationsTable.discordId,
      discordUsername: applicationsTable.discordUsername,
      type: applicationsTable.type,
      careerId: applicationsTable.careerId,
      careerTitle: careersTable.title,
      status: applicationsTable.status,
      answers: applicationsTable.answers,
      reviewedBy: applicationsTable.reviewedBy,
      reviewNotes: applicationsTable.reviewNotes,
      submittedAt: applicationsTable.submittedAt,
      reviewedAt: applicationsTable.reviewedAt,
    })
    .from(applicationsTable)
    .leftJoin(careersTable, eq(applicationsTable.careerId, careersTable.id))
    .where(eq(applicationsTable.id, params.data.id));

  if (!app) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json({
    ...app,
    submittedAt: app.submittedAt.toISOString(),
    reviewedAt: app.reviewedAt?.toISOString() ?? null,
  });
});

router.patch("/applications/:id", async (req, res): Promise<void> => {
  const params = UpdateApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status && parsed.data.status !== "pending") {
    updateData.reviewedAt = new Date();
  }

  const [updated] = await db
    .update(applicationsTable)
    .set(updateData)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json({
    ...updated,
    careerTitle: null,
    submittedAt: updated.submittedAt.toISOString(),
    reviewedAt: updated.reviewedAt?.toISOString() ?? null,
  });
});

export default router;
