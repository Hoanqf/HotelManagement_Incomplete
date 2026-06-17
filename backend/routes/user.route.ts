import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", UserController.login);

// Tất cả các route bên dưới đều cần đăng nhập
router.use(authMiddleware);

router.get("/positions", UserController.getPositions);
router.get("/cloudinary-config", UserController.getCloudinaryConfig);
router.get("/:id", UserController.getById);
router.put("/:id", UserController.update);

// Các route chỉ dành cho ADMIN hoặc MANAGER hoặc SUPERADMIN
router.post("/positions", requireRole(["ADMIN", "MANAGER", "SUPERADMIN"]), UserController.createPosition);

// Các route chỉ dành riêng cho ADMIN hoặc SUPERADMIN
router.get("/", requireRole(["ADMIN", "SUPERADMIN"]), UserController.getUsers);
router.post("/", requireRole(["ADMIN", "SUPERADMIN"]), UserController.create);
router.delete("/:id", requireRole(["ADMIN", "SUPERADMIN"]), UserController.delete);

export default router;