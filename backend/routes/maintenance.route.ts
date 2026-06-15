import { Router } from "express";
import { MaintenanceController } from "../controllers/maintenance.controller";

const router = Router();

router.get("/", MaintenanceController.getRecords);
router.post("/", MaintenanceController.create);
router.put("/:id/complete", MaintenanceController.complete);
router.put("/:id/status", MaintenanceController.updateStatus);

export default router;
