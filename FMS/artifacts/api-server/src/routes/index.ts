import { Router, type IRouter } from "express";
import healthRouter from "./health";
import membersRouter from "./members";
import ranksRouter from "./ranks";
import departmentsRouter from "./departments";
import patrolLogsRouter from "./patrolLogs";
import applicationsRouter from "./applications";
import disciplinaryRouter from "./disciplinary";
import activityRouter from "./activity";
import whitelistRouter from "./whitelist";
import careersRouter from "./careers";
import statsRouter from "./stats";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(membersRouter);
router.use(ranksRouter);
router.use(departmentsRouter);
router.use(patrolLogsRouter);
router.use(applicationsRouter);
router.use(disciplinaryRouter);
router.use(activityRouter);
router.use(whitelistRouter);
router.use(careersRouter);
router.use(statsRouter);

export default router;
