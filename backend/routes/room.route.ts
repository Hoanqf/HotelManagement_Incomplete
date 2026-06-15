import { Router } from "express";
import { RoomController } from "../controllers/room.controller";

const router = Router();

router.get("/", RoomController.getRooms);
router.get("/types", RoomController.getRoomTypes);
router.post("/", RoomController.create);
router.put("/:id", RoomController.update);
router.delete("/:id", RoomController.delete);

export default router;
