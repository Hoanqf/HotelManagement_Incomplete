import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";

const router = Router();

router.get("/", BookingController.getBookings);
router.post("/", BookingController.create);
router.put("/:id/status", BookingController.updateStatus);

export default router;
