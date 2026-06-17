import { Router } from "express";
import { FinanceController } from "../controllers/finance.controller";
import { authMiddleware, requireRole } from "../middleware/auth.middleware";

const router = Router();

// Tất cả các route tài chính đều yêu cầu đăng nhập và phân quyền
router.use(authMiddleware);
router.use(requireRole(["ADMIN", "MANAGER", "SUPERADMIN"]));

router.get("/", FinanceController.getTransactions);
router.post("/", FinanceController.create);
router.get("/stats", FinanceController.getStats);
router.delete("/:id", requireRole(["ADMIN", "SUPERADMIN"]), FinanceController.delete);

export default router;
