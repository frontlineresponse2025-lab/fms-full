import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, careersTable, departmentsTable, applicationsTable } from "@workspace/db";
import {
  ListCareersQueryParams,
  CreateCareerBody,
  UpdateCareerParams,
  UpdateCareerBody,
  DeleteCareerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/careers", async (req, res): Promise<void> => {
  const query = ListCareersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { departmentId, isOpen } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (departmentId) conditions.push(eq(careersTable.departmentId, departmentId));
  if (isOpen !== undefined) conditions.push(eq(careersTable.isOpen, isOpen));

  const careers = await db
    .select({
      id: careersTable.id,
      title: careersTable.title,
      departmentId: careersTable.departmentId,
      departmentName: departmentsTable.name,
      description: careersTable.description,
      requirements: careersTable.requirements,
      isOpen: careersTable.isOpen,
      createdAt: careersTable.createdAt,
      applicationCount: sql<number>`COUNT(${applicationsTable.id})`,
    })
    .from(careersTable)
    .leftJoin(departmentsTable, eq(careersTable.departmentId, departmentsTable.id))
    .leftJoin(applicationsTable, eq(applicationsTable.careerId, careersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(careersTable.id, departmentsTable.name)
    .orderBy(careersTable.createdAt);

  res.json(
    careers.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      applicationCount: Number(c.applicationCount),
    }))
  );
});

router.post("/careers", async (req, res): Promise<void> => {
  const parsed = CreateCareerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [career] = await db.insert(careersTable).values(parsed.data).returning();
  res.status(201).json({ ...career, departmentName: null, applicationCount: 0, createdAt: career.createdAt.toISOString() });
});

router.patch("/careers/:id", async (req, res): Promise<void> => {
  const params = UpdateCareerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCareerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(careersTable)
    .set(parsed.data)
    .where(eq(careersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Career not found" });
    return;
  }

  res.json({ ...updated, departmentName: null, applicationCount: 0, createdAt: updated.createdAt.toISOString() });
});

router.delete("/careers/:id", async (req, res): Promise<void> => {
  const params = DeleteCareerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(careersTable)
    .where(eq(careersTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Career not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
