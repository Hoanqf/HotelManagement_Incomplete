import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Áp dụng middleware kiểm tra đăng nhập cho tất cả các request kho
router.use(authMiddleware);

// Routes cho sản phẩm kho (Items)
router.get("/items", InventoryController.getItems);
router.post("/items", InventoryController.createItem);
router.put("/items/:id", InventoryController.updateItem);
router.delete("/items/:id", InventoryController.deleteItem);

// Routes cho giao dịch kho (Transactions)
router.get("/transactions", InventoryController.getTransactions);
router.post("/import", InventoryController.importStock);
router.post("/export", InventoryController.exportStock);

export default router;
