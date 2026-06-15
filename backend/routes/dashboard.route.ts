import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats", DashboardController.getStats);
router.get("/reports", DashboardController.getReportStats);
router.get("/notifications", DashboardController.getNotifications);

export default router;
