import { Router } from "express";
import { ServiceController } from "../controllers/service.controller";

const router = Router();

router.get("/", ServiceController.getServices);
router.post("/", ServiceController.create);
router.put("/:id", ServiceController.update);
router.delete("/:id", ServiceController.delete);

export default router;
