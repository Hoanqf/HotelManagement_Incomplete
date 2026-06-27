import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { InventoryService } from "../services/inventory.service";

export const InventoryController = {
  // 1. Lấy danh sách sản phẩm kho
  getItems: async (req: AuthRequest, res: Response) => {
    try {
      const items = await InventoryService.getAllItems();
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi khi tải danh sách kho: " + error.message });
    }
  },

  // 2. Tạo sản phẩm kho mới
  createItem: async (req: AuthRequest, res: Response) => {
    try {
      const newItem = await InventoryService.createItem(req.body);
      res.status(201).json({
        message: "Tạo sản phẩm kho thành công",
        data: newItem
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 3. Cập nhật sản phẩm kho
  updateItem: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await InventoryService.updateItem(id, req.body);
      res.json({
        message: "Cập nhật sản phẩm kho thành công",
        data: updated
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 4. Xóa sản phẩm kho
  deleteItem: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      await InventoryService.deleteItem(id);
      res.json({ message: "Xóa sản phẩm kho thành công" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 5. Xem lịch sử giao dịch kho
  getTransactions: async (req: AuthRequest, res: Response) => {
    try {
      const filters = {
        type: req.query.type as string,
        itemId: req.query.itemId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };
      const transactions = await InventoryService.getAllTransactions(filters);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi tải lịch sử giao dịch kho: " + error.message });
    }
  },

  // 6. Nhập kho
  importStock: async (req: AuthRequest, res: Response) => {
    try {
      const { itemId, quantity, price, reason, referenceId } = req.body;
      const createdById = req.user?.id; // Lấy ID người làm lệnh nhập từ token

      const newTx = await InventoryService.importStock({
        itemId,
        quantity: Number(quantity),
        price: Number(price),
        reason,
        referenceId,
        createdById
      });

      res.status(201).json({
        message: "Nhập kho thành công và đã tự động ghi nhận chi phí tài chính",
        data: newTx
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 7. Xuất kho
  exportStock: async (req: AuthRequest, res: Response) => {
    try {
      const { itemId, quantity, reason, referenceId } = req.body;
      const createdById = req.user?.id; // Lấy ID người làm lệnh xuất từ token

      const newTx = await InventoryService.exportStock({
        itemId,
        quantity: Number(quantity),
        reason,
        referenceId,
        createdById
      });

      res.status(201).json({
        message: "Xuất kho thành công",
        data: newTx
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
};
