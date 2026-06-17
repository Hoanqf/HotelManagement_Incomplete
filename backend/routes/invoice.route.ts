import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";

const router = Router();

router.get("/", InvoiceController.getInvoices);
router.get("/no-invoice", InvoiceController.getBookingsWithoutInvoice);
router.get("/booking/:bookingId", InvoiceController.getInvoiceByBookingId);
router.get("/:id", InvoiceController.getInvoiceById);
router.post("/", InvoiceController.create);
router.put("/:id/pay", InvoiceController.pay);

export default router;
