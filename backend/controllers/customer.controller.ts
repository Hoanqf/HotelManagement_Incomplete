import { Request, Response } from "express";
import { CustomerService } from "../services/customer.service";

export const CustomerController = {
  // 1. Lấy danh sách khách hàng
  getAll: async (req: Request, res: Response) => {
    try {
      const customers = await CustomerService.getAllCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi server khi lấy danh sách khách hàng" });
    }
  },

  // 2. Lấy chi tiết khách hàng theo ID
  getById: async (req: Request, res: Response) => {
    try {
      const customer = await CustomerService.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Không tìm thấy thông tin khách hàng" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi server khi lấy thông tin khách hàng" });
    }
  },

  // 3. Tìm khách hàng theo SĐT (dùng cho autocomplete)
  getByPhone: async (req: Request, res: Response) => {
    try {
      const phone = req.query.phone as string;
      if (!phone) {
        return res.status(400).json({ message: "Thiếu số điện thoại truy vấn" });
      }
      const customer = await CustomerService.findCustomerByPhone(phone);
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Lỗi server khi tìm khách hàng" });
    }
  },

  // 4. Tạo mới khách hàng
  create: async (req: Request, res: Response) => {
    try {
      const newCustomer = await CustomerService.createCustomer(req.body);
      res.status(201).json(newCustomer);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi tạo mới khách hàng" });
    }
  },

  // 5. Cập nhật khách hàng
  update: async (req: Request, res: Response) => {
    try {
      const updated = await CustomerService.updateCustomer(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi cập nhật khách hàng" });
    }
  },

  // 6. Xóa khách hàng
  delete: async (req: Request, res: Response) => {
    try {
      await CustomerService.deleteCustomer(req.params.id);
      res.json({ message: "Xóa khách hàng thành công" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Lỗi khi xóa khách hàng" });
    }
  }
};
