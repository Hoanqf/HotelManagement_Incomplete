import { Request, Response } from "express";
import { BookingService } from "../services/booking.service";

export const BookingController = {
  // 1. Lấy danh sách đặt phòng
  getBookings: async (req: Request, res: Response) => {
    try {
      const data = await BookingService.getAllBookings();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng: " + error.message });
    }
  },

  // 2. Tạo đặt phòng mới
  create: async (req: Request, res: Response) => {
    try {
      const newBooking = await BookingService.createBooking(req.body);
      res.status(201).json({
        message: "Đặt phòng thành công",
        data: newBooking
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 3. Cập nhật trạng thái đặt phòng
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Trạng thái không được bỏ trống" });
      }

      const updated = await BookingService.updateBookingStatus(id, status);
      res.json({
        message: "Cập nhật trạng thái thành công",
        data: updated
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
};
