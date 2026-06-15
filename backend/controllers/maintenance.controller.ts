import { Request, Response } from "express";
import { MaintenanceService } from "../services/maintenance.service";

export const MaintenanceController = {
  // 1. Lấy danh sách bản ghi bảo trì
  getRecords: async (req: Request, res: Response) => {
    try {
      const records = await MaintenanceService.getAllRecords();
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi server khi lấy lịch sử bảo trì: " + error.message });
    }
  },

  // 2. Tạo yêu cầu bảo trì mới
  create: async (req: Request, res: Response) => {
    try {
      const record = await MaintenanceService.createRecord(req.body);
      res.status(201).json({
        message: "Tạo yêu cầu bảo trì thành công",
        data: record
      });
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi khi tạo yêu cầu bảo trì: " + error.message });
    }
  },

  // 3. Hoàn thành bảo trì
  complete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await MaintenanceService.completeRecord(id);
      res.json({
        message: "Hoàn thành bảo trì thành công",
        data: updated
      });
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi khi hoàn thành bảo trì: " + error.message });
    }
  },

  // 4. Cập nhật trạng thái bảo trì linh hoạt
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Trạng thái không được bỏ trống" });
      }

      const updated = await MaintenanceService.updateRecordStatus(id, status);
      res.json({
        message: "Cập nhật trạng thái bảo trì thành công",
        data: updated
      });
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi khi cập nhật trạng thái: " + error.message });
    }
  }
};
