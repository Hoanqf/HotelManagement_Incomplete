import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không tìm thấy token xác thực hoặc sai định dạng" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "pms_secret_key") as { id: string; role: string };
    
    // Bỏ qua kiểm tra DB đối với tài khoản admin ảo hệ thống (khi DB offline)
    if (decoded.id === "0" || decoded.id === "admin-env") {
      req.user = decoded;
      return next();
    }

    // Kiểm tra trạng thái của user trong cơ sở dữ liệu
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(decoded.id) },
      select: { status: true }
    });

    if (!dbUser) {
      return res.status(401).json({ message: "Tài khoản không tồn tại trên hệ thống" });
    }

    if (dbUser.status === "LOCKED") {
      return res.status(401).json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên." });
    }

    if (dbUser.status === "INACTIVE") {
      return res.status(401).json({ message: "Tài khoản của bạn đã ngừng hoạt động." });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn hoặc token không hợp lệ" });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Yêu cầu đăng nhập trước" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
    }

    next();
  };
};
