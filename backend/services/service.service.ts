import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

export const ServiceService = {
  // 1. Lấy danh sách dịch vụ (Tự động seed nếu DB trống)
  getAllServices: async () => {
    let servicesList = await prisma.service.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Nếu DB chưa có dịch vụ nào, tiến hành seed mặc định
    if (servicesList.length === 0) {
      const defaultServices = [
        { name: "Ăn sáng buffet", price: new Prisma.Decimal(150000), unit: "Lượt", status: "ACTIVE" },
        { name: "Giặt ủi quần áo", price: new Prisma.Decimal(50000), unit: "Kg", status: "ACTIVE" },
        { name: "Spa & Massage toàn thân", price: new Prisma.Decimal(500000), unit: "Giờ", status: "ACTIVE" },
        { name: "Xe đưa đón sân bay", price: new Prisma.Decimal(300000), unit: "Lượt", status: "ACTIVE" },
      ];

      await prisma.service.createMany({
        data: defaultServices,
      });

      servicesList = await prisma.service.findMany({
        orderBy: {
          name: "asc",
        },
      });
    }

    return servicesList.map(s => ({
      ...s,
      id: s.id.toString(),
      price: Number(s.price),
    }));
  },

  // 2. Tạo dịch vụ mới
  createService: async (data: any) => {
    const { name, price, unit, status } = data;
    const newService = await prisma.service.create({
      data: {
        name,
        price: new Prisma.Decimal(Number(price)),
        unit: unit || "Lượt",
        status: status || "ACTIVE",
      },
    });

    return {
      ...newService,
      id: newService.id.toString(),
      price: Number(newService.price),
    };
  },

  // 3. Cập nhật dịch vụ
  updateService: async (id: string, data: any) => {
    const cleanId = BigInt(id);
    const { name, price, unit, status } = data;

    const updated = await prisma.service.update({
      where: { id: cleanId },
      data: {
        name,
        price: price !== undefined ? new Prisma.Decimal(Number(price)) : undefined,
        unit: unit !== undefined ? unit : undefined,
        status: status !== undefined ? status : undefined,
      },
    });

    return {
      ...updated,
      id: updated.id.toString(),
      price: Number(updated.price),
    };
  },

  // 4. Xóa dịch vụ
  deleteService: async (id: string) => {
    const cleanId = BigInt(id);

    // Xóa tất cả các liên kết trong bảng booking_services trước để tránh lỗi ràng buộc khóa ngoại
    await prisma.bookingService.deleteMany({
      where: { serviceId: cleanId },
    });

    const deleted = await prisma.service.delete({
      where: { id: cleanId },
    });

    return {
      ...deleted,
      id: deleted.id.toString(),
    };
  }
};
