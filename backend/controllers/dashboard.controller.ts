import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export const DashboardController = {
  getStats: async (req: Request, res: Response) => {
    try {
      const stats = await DashboardService.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi server khi lấy số liệu thống kê: " + error.message });
    }
  },

  getReportStats: async (req: Request, res: Response) => {
    try {
      const reportStats = await DashboardService.getReportStats();
      res.json(reportStats);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi server khi lấy báo cáo: " + error.message });
    }
  },

  getNotifications: async (req: Request, res: Response) => {
    try {
      const notifications = await DashboardService.getNotifications();
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi server khi lấy danh sách thông báo: " + error.message });
    }
  }
};
