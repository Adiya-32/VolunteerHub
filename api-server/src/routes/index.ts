import { Router, type IRouter } from "express";
import healthRouter from "./health";
import volunteersRouter from "./volunteers";
import tasksRouter from "./tasks";
import matchesRouter from "./matches";
import chatRouter from "./chat";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(volunteersRouter);
router.use(tasksRouter);
router.use(matchesRouter);
router.use(chatRouter);

export default router;
