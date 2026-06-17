import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import jwt from "jsonwebtoken";

export const UserController = {
  // 1. Lấy danh sách users
  getUsers: async (req: Request, res: Response) => {
    try {
      const users = await UserService.getAllUsers();
      // Chuyển đổi BigInt sang String để tránh lỗi JSON khi gửi về frontend
      const result = users.map(u => ({ 
        ...u, 
        id: u.id.toString() 
      }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  },

  // 2. Tạo user mới
  create: async (req: Request, res: Response) => {
    try {
      const newUser = await UserService.createUser(req.body);
      res.status(201).json({ message: "Thêm thành công", data: newUser });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  // 3. Lấy danh sách chức vụ (Positions) cho dropdown
  getPositions: async (req: Request, res: Response) => {
    try {
      const data = await UserService.getPositions();
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ message: "Lỗi server khi lấy chức vụ: " + error.message });
    }
  },
  // 4. Lấy cấu hình Cloudinary để frontend có thể sử dụng khi upload hình ảnh
  getCloudinaryConfig: async (req: Request, res: Response) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
  });
  },
  // 5. Cập nhật thong tin tai khoan 
  getById: async (req: Request, res: Response) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy" });
    // Chuyển BigInt sang String
    res.json({ ...user, id: user.id.toString() });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
},
  update: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const targetId = req.params.id;

      if (!authUser) {
        return res.status(401).json({ message: "Yêu cầu đăng nhập trước" });
      }

      // Nếu không phải ADMIN/SUPERADMIN và cố cập nhật tài khoản người khác -> Chặn
      if (authUser.role !== "ADMIN" && authUser.role !== "SUPERADMIN" && authUser.id !== targetId) {
        return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa tài khoản của người khác" });
      }

      // Nếu không phải ADMIN/SUPERADMIN tự cập nhật chính mình -> Lọc bỏ role và status để tránh leo thang đặc quyền
      const updateData = { ...req.body };
      if (authUser.role !== "ADMIN" && authUser.role !== "SUPERADMIN") {
        delete updateData.role;
        delete updateData.status;
      }

      const updatedUser = await UserService.updateUser(targetId, updateData);
      res.json({ 
        message: "Cập nhật thành công",
        data: {
          ...updatedUser,
          id: updatedUser.id.toString()
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
// 6. Tạo chức vụ mới (Position)
createPosition: async (req: Request, res: Response) => {
  try {
    const newPos = await UserService.createPosition(req.body);
    res.status(201).json(newPos);
  } catch (error: any) {
    res.status(400).json({ message: "Chức vụ đã tồn tại hoặc dữ liệu không hợp lệ" });
  }
},

// 7. Đăng nhập
login: async (req: Request, res: Response) => {
  try {
    // Controller CHỈ gọi sang Service và truyền body vào
    const result = await UserService.login(req.body);
    
    // Trả về kết quả cho Frontend
    res.json(result);
  } catch (error: any) {
    // Nếu có lỗi (sai pass, sai email), trả về lỗi 401
    res.status(401).json({ message: error.message });
  }
},

// 8. Xóa tài khoản
delete: async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "SUPERADMIN")) {
      return res.status(403).json({ message: "Chỉ Quản trị viên mới được phép xóa tài khoản" });
    }

    const targetId = req.params.id;
    if (authUser.id === targetId) {
      return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản của chính mình" });
    }

    await UserService.deleteUser(targetId);
    res.json({ message: "Xóa tài khoản thành công" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

};