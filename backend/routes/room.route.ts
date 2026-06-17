import { Router } from "express";
import { RoomController } from "../controllers/room.controller";
import { authMiddleware, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.get("/", RoomController.getRooms);
router.get("/types", RoomController.getRoomTypes);

// Chỉ SUPERADMIN mới có quyền thêm, sửa, xóa phòng
router.post("/", authMiddleware, requireRole(["SUPERADMIN"]), RoomController.create);
router.put("/:id", authMiddleware, requireRole(["SUPERADMIN"]), RoomController.update);
router.delete("/:id", authMiddleware, requireRole(["SUPERADMIN"]), RoomController.delete);

export default router;
