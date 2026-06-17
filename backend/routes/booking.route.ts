import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";

const router = Router();

router.get("/", BookingController.getBookings);
router.post("/", BookingController.create);
router.put("/:id/status", BookingController.updateStatus);
router.put("/:id/extend", BookingController.extend);
router.put("/:id/change-room", BookingController.changeRoom);
router.get("/:id/services", BookingController.getServices);
router.post("/:id/services", BookingController.addService);
router.delete("/:id/services/:bookingServiceId", BookingController.removeService);

export default router;
