import { Request, Response } from "express";
import { InvoiceService } from "../services/invoice.service";

export const InvoiceController = {
  // 1. Lấy danh sách hóa đơn
  getInvoices: async (req: Request, res: Response) => {
    try {
      const data = await InvoiceService.getAllInvoices();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách hóa đơn: " + error.message });
    }
  },

  // 2. Lấy chi tiết hóa đơn
  getInvoiceById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await InvoiceService.getInvoiceById(id);
      if (!data) {
        return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi khi lấy chi tiết hóa đơn: " + error.message });
    }
  },

  // 2.5. Lấy hóa đơn theo bookingId
  getInvoiceByBookingId: async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const data = await InvoiceService.getInvoiceByBookingId(bookingId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi khi lấy hóa đơn của đặt phòng: " + error.message });
    }
  },

  // 3. Lấy đặt phòng chưa lập hóa đơn
  getBookingsWithoutInvoice: async (req: Request, res: Response) => {
    try {
      const data = await InvoiceService.getBookingsWithoutInvoice();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi khi lấy đặt phòng chưa lập hóa đơn: " + error.message });
    }
  },

  // 4. Tạo hóa đơn mới
  create: async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.body;
      if (!bookingId) {
        return res.status(400).json({ message: "Thiếu thông tin bookingId" });
      }
      const newInvoice = await InvoiceService.createInvoice(req.body);
      res.status(201).json({
        message: "Tạo hóa đơn thành công",
        data: newInvoice
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 5. Thanh toán hóa đơn
  pay: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await InvoiceService.payInvoice(id, req.body);
      res.json({
        message: "Thanh toán hóa đơn thành công",
        data: updated
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
};
