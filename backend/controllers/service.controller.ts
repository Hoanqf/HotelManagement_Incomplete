import { Request, Response } from "express";
import { ServiceService } from "../services/service.service";

export const ServiceController = {
  // 1. Lấy danh sách dịch vụ
  getServices: async (req: Request, res: Response) => {
    try {
      const services = await ServiceService.getAllServices();
      res.json(services);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi server khi tải danh sách dịch vụ: " + error.message });
    }
  },

  // 2. Tạo dịch vụ mới
  create: async (req: Request, res: Response) => {
    try {
      const newService = await ServiceService.createService(req.body);
      res.status(201).json({
        message: "Tạo dịch vụ thành công",
        data: newService,
      });
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi khi tạo dịch vụ: " + error.message });
    }
  },

  // 3. Cập nhật dịch vụ
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await ServiceService.updateService(id, req.body);
      res.json({
        message: "Cập nhật dịch vụ thành công",
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi khi cập nhật dịch vụ: " + error.message });
    }
  },

  // 4. Xóa dịch vụ
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await ServiceService.deleteService(id);
      res.json({
        message: "Xóa dịch vụ thành công",
      });
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi khi xóa dịch vụ: " + error.message });
    }
  }
};
