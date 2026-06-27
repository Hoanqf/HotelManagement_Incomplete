import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const UserService = {
  // 1. Lấy danh sách user
  getAllUsers: async () => {
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          role: "SUPERADMIN"
        }
      },
      select: {
        id: true,
        usercode: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        permissions: true,
        positionId: true,
        createdAt: true,
        position: {
          select: {
            id: true,
            position_name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => ({
      ...user,
      id: user.id.toString(),
    }));
  },

  // 2. Tạo user mới
  createUser: async (data: any) => {
    const { password, ...userData } = data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    return {
      ...newUser,
      id: newUser.id.toString()
    };
  },

  // 3. Lấy danh sách chức vụ
  getPositions: async () => {
    return await prisma.position.findMany({
      select: {
        id: true,
        position_name: true,
      }
    });
  },

  // 4. Lấy thông tin user theo ID (để edit)
  getUserById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      include: { position: true } 
    });
    
    if (!user) return null;

    return {
      ...user,
      id: user.id.toString()
    };
  },

  // 5. Cập nhật thông tin người dùng
  updateUser: async (id: string, data: any) => {
    if (id === "0" || id === "admin-env") {
      // Nếu là tài khoản Admin ảo (khi DB offline), trả về thông tin cập nhật giả lập
      return {
        id: "0",
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || "",
        avatarUrl: data.avatarUrl || null,
        role: "ADMIN",
        usercode: "ADMIN-SYSTEM",
        email: process.env.ADMIN_EMAIL || "admin@gmail.com",
        status: "ACTIVE"
      };
    }

    const { password, ...userData } = data;
    const updateData: any = { ...userData };

    // Nếu Admin có nhập mật khẩu mới (không để trống) thì mới hash
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    return await prisma.user.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
  },

  // 6. Tạo chức vụ mới (Position)
  createPosition: async (data: { position_name: string; description?: string }) => {
    return await prisma.position.create({
      data: {
        position_name: data.position_name,
        description: data.description,
      },
    });
  },

  // 7. Hàm đăng nhập
  login: async (loginData: any) => {
    const { password } = loginData;
    const loginIdentifier = loginData.username || loginData.email || "";

    if (!loginIdentifier || !password) {
      throw new Error("Thiếu tên đăng nhập hoặc mật khẩu");
    }

    // 1. Lấy cấu hình từ .env
    const envAdminEmail = process.env.ADMIN_EMAIL;
    const envAdminPass = process.env.ADMIN_PASSWORD;

    // 2. CÁCH 1: KIỂM TRA TÀI KHOẢN TRONG .ENV TRƯỚC
    const isEnvAdmin = (envAdminEmail && (loginIdentifier === envAdminEmail || loginIdentifier === "admin" || loginIdentifier === "ADMIN-SYSTEM")) && password === envAdminPass;

    if (isEnvAdmin) {
      console.log("--- Đăng nhập bằng quyền Admin (.env) ---");
      
      let dbAdmin = null;
      try {
        // Thử tìm admin trong database xem có sẵn chưa
        dbAdmin = await prisma.user.findFirst({
          where: {
            OR: [
              { email: envAdminEmail },
              { usercode: "ADMIN-SYSTEM" }
            ]
          },
          include: { position: true }
        });
      } catch (dbError) {
        console.warn("⚠️ Cảnh báo: Không thể truy vấn Database. Đăng nhập bằng tài khoản Admin ảo.");
      }

      // Nếu database online mà chưa có tài khoản admin, tự động tạo mới
      if (!dbAdmin) {
        try {
          const hashedPassword = await bcrypt.hash(envAdminPass, 10);
          
          let adminPos = await prisma.position.findUnique({
            where: { position_name: "ADMIN" }
          });
          if (!adminPos) {
            adminPos = await prisma.position.create({
              data: { position_name: "ADMIN", description: "Quản trị viên" }
            });
          }

          dbAdmin = await prisma.user.create({
            data: {
              usercode: "ADMIN-SYSTEM",
              fullName: "Quản trị viên Hệ thống",
              email: envAdminEmail,
              password: hashedPassword,
              role: "ADMIN",
              status: "ACTIVE",
              positionId: adminPos.id
            },
            include: { position: true }
          });
        } catch (createError) {
          console.warn("⚠️ Cảnh báo: Không thể tạo Admin trong DB (DB offline). Sử dụng User ảo ID '0'.");
          
          // Trả về tài khoản Admin ảo nếu DB offline
          const token = jwt.sign(
            { id: "admin-env", role: "ADMIN" },
            process.env.JWT_SECRET || "pms_secret_key",
            { expiresIn: "1d" }
          );

          return {
            user: {
              id: "0",
              usercode: "ADMIN-SYSTEM",
              fullName: "Quản trị viên Hệ thống",
              email: envAdminEmail,
              role: "ADMIN",
              status: "ACTIVE",
              avatarUrl: null
            },
            token
          };
        }
      }

      // Đăng nhập bằng tài khoản database Admin thực tế
      if (dbAdmin) {
        if (dbAdmin.status === "LOCKED") {
          throw new Error("Tài khoản Quản trị viên đã bị khóa. Vui lòng liên hệ hỗ trợ.");
        }
        if (dbAdmin.status === "INACTIVE") {
          throw new Error("Tài khoản Quản trị viên đã ngừng hoạt động.");
        }
      }

      const token = jwt.sign(
        { id: dbAdmin.id.toString(), role: "ADMIN" },
        process.env.JWT_SECRET || "pms_secret_key",
        { expiresIn: "1d" }
      );

      const { password: _, ...userWithoutPass } = dbAdmin;
      return {
        user: { ...userWithoutPass, id: dbAdmin.id.toString() },
        token
      };
    }

    // 3. CÁCH 2: NẾU KHÔNG PHẢI TÀI KHOẢN .ENV -> TÌM TRONG SQL DATABASE
    const user = await prisma.user.findFirst({ 
      where: {
        OR: [
          { email: loginIdentifier },
          { usercode: loginIdentifier }
        ]
      },
      include: { position: true }
    });

    // Nếu không tìm thấy trong cả .env và Database
    if (!user) {
      throw new Error("Tên đăng nhập hoặc Email không tồn tại trong hệ thống");
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === "LOCKED") {
      throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.");
    }
    if (user.status === "INACTIVE") {
      throw new Error("Tài khoản của bạn đã ngừng hoạt động.");
    }
    if (user.status === "PENDING") {
      throw new Error("Tài khoản của bạn đang chờ được kích hoạt.");
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Mật khẩu không chính xác");
    }

    // Tạo token cho user bình thường
    const token = jwt.sign(
      { id: user.id.toString(), role: user.role },
      process.env.JWT_SECRET || "pms_secret_key",
      { expiresIn: "1d" }
    );

    // Trả về dữ liệu (loại bỏ password)
    const { password: _, ...userWithoutPass } = user;
    return { 
      user: { ...userWithoutPass, id: user.id.toString() }, 
      token 
    };
  },

  // 8. Xóa tài khoản nhân viên
  deleteUser: async (id: string) => {
    const cleanId = BigInt(id);

    // Gỡ mối liên kết khóa ngoại trước để tránh lỗi ràng buộc cơ sở dữ liệu
    await prisma.booking.updateMany({
      where: { userId: cleanId },
      data: { userId: null }
    });

    await prisma.maintenanceRecord.updateMany({
      where: { staffId: cleanId },
      data: { staffId: null }
    });

    return await prisma.user.delete({
      where: { id: cleanId }
    });
  }
};