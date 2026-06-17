import { Request, Response } from "express";
import { FinanceService } from "../services/finance.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const FinanceController = {
  // 1. Lấy danh sách giao dịch
  getTransactions: async (req: Request, res: Response) => {
    try {
      const { type, category, startDate, endDate, search } = req.query;
      const transactions = await FinanceService.getAllTransactions({
        type: type as string,
        category: category as string,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string
      });
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi khi lấy danh sách giao dịch" });
    }
  },

  // 2. Tạo giao dịch mới
  create: async (req: AuthRequest, res: Response) => {
    try {
      const authUser = req.user;
      if (!authUser) {
        return res.status(401).json({ message: "Yêu cầu đăng nhập trước" });
      }

      const { type, category, amount, description, date } = req.body;
      if (!type || !category || amount === undefined) {
        return res.status(400).json({ message: "Thiếu dữ liệu bắt buộc (type, category, amount)" });
      }

      if (Number(amount) <= 0) {
        return res.status(400).json({ message: "Số tiền giao dịch phải lớn hơn 0" });
      }

      const newTx = await FinanceService.createTransaction({
        type,
        category,
        amount: Number(amount),
        description,
        date,
        createdById: authUser.id
      });

      res.status(201).json({ message: "Thêm giao dịch thành công", data: newTx });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi tạo giao dịch mới" });
    }
  },

  // 3. Xóa giao dịch (Chỉ dành cho ADMIN)
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const authUser = req.user;
      if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "SUPERADMIN")) {
        return res.status(403).json({ message: "Chỉ Quản trị viên mới được phép xóa giao dịch" });
      }

      const { id } = req.params;
      await FinanceService.deleteTransaction(id);
      res.json({ message: "Xóa giao dịch thành công" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi xóa giao dịch" });
    }
  },

  // 4. Lấy thống kê tổng quan
  getStats: async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await FinanceService.getStats({
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi khi tính toán thống kê tài chính" });
    }
  }
};
