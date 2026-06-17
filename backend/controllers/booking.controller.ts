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
  },

  // 4. Lấy danh sách dịch vụ của đặt phòng
  getServices: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await BookingService.getBookingServices(id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách dịch vụ đặt phòng: " + error.message });
    }
  },

  // 5. Thêm dịch vụ vào đặt phòng
  addService: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { serviceId, quantity } = req.body;

      if (!serviceId) {
        return res.status(400).json({ message: "Mã dịch vụ không được bỏ trống" });
      }
      if (!quantity || Number(quantity) <= 0) {
        return res.status(400).json({ message: "Số lượng phải lớn hơn 0" });
      }

      const result = await BookingService.addBookingService(id, serviceId, Number(quantity));
      res.status(201).json({
        message: "Thêm dịch vụ thành công",
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 6. Xóa dịch vụ khỏi đặt phòng
  removeService: async (req: Request, res: Response) => {
    try {
      const { bookingServiceId } = req.params;

      if (!bookingServiceId) {
        return res.status(400).json({ message: "Mã dịch vụ đặt phòng không được bỏ trống" });
      }

      const result = await BookingService.removeBookingService(bookingServiceId);
      res.json({
        message: "Xóa dịch vụ thành công",
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 7. Gia hạn đặt phòng
  extend: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { checkOutDate } = req.body;

      if (!checkOutDate) {
        return res.status(400).json({ message: "Thời gian trả phòng mới không được bỏ trống" });
      }

      const result = await BookingService.extendBooking(id, checkOutDate);
      res.json({
        message: "Gia hạn đặt phòng thành công",
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 8. Đổi phòng
  changeRoom: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newRoomId } = req.body;

      if (!newRoomId) {
        return res.status(400).json({ message: "Mã phòng mới không được bỏ trống" });
      }

      const result = await BookingService.changeRoom(id, newRoomId);
      res.json({
        message: "Đổi phòng thành công",
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
};
