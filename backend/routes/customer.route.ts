import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Tất cả các route khách hàng đều yêu cầu đăng nhập
router.use(authMiddleware);

router.get("/search", CustomerController.getByPhone);
router.get("/", CustomerController.getAll);
router.get("/:id", CustomerController.getById);
router.post("/", CustomerController.create);
router.put("/:id", CustomerController.update);
router.delete("/:id", CustomerController.delete);

export default router;
