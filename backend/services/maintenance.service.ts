import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

const cleanRoomId = (id: string | number): bigint => {
  if (typeof id === "string") {
    const clean = id.replace("r-", "");
    return BigInt(clean);
  }
  return BigInt(id);
};

export const MaintenanceService = {
  // 1. Lấy toàn bộ bản ghi bảo trì
  getAllRecords: async () => {
    const records = await prisma.maintenanceRecord.findMany({
      include: {
        room: {
          include: {
            roomType: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return records.map(r => ({
      ...r,
      id: r.id.toString(),
      roomId: `r-${r.roomId.toString()}`,
      staffId: r.staffId ? r.staffId.toString() : null,
      repairCost: Number(r.repairCost),
      room: {
        ...r.room,
        id: `r-${r.room.id.toString()}`,
        roomTypeId: `rt-${r.room.roomTypeId.toString()}`,
        pricePerNight: r.room.pricePerNight !== null ? Number(r.room.pricePerNight) : Number(r.room.roomType.pricePerNight),
        capacity: r.room.capacity !== null && r.room.capacity !== undefined ? r.room.capacity : r.room.roomType.capacity,
        roomType: {
          ...r.room.roomType,
          id: `rt-${r.room.roomType.id.toString()}`,
          pricePerNight: Number(r.room.roomType.pricePerNight)
        }
      }
    }));
  },

  // 2. Tạo bản ghi bảo trì mới
  createRecord: async (data: any) => {
    const { roomId, description, repairCost, startDate, remarks } = data;
    const cleanId = cleanRoomId(roomId);

    // Tạo bản ghi bảo trì
    const newRecord = await prisma.maintenanceRecord.create({
      data: {
        roomId: cleanId,
        description: description || "",
        status: "IN_PROGRESS", // Đổi mặc định thành IN_PROGRESS (Đang sửa chữa) để khớp với giao diện
        startDate: startDate ? new Date(startDate) : new Date(),
        repairCost: repairCost ? new Prisma.Decimal(Number(repairCost)) : new Prisma.Decimal(0),
        remarks: remarks || ""
      },
      include: {
        room: {
          include: {
            roomType: true
          }
        }
      }
    });

    // Tự động cập nhật trạng thái phòng sang MAINTENANCE
    await prisma.room.update({
      where: { id: cleanId },
      data: { status: "MAINTENANCE" }
    });

    return {
      ...newRecord,
      id: newRecord.id.toString(),
      roomId: `r-${newRecord.roomId.toString()}`,
      staffId: newRecord.staffId ? newRecord.staffId.toString() : null,
      repairCost: Number(newRecord.repairCost),
      room: {
        ...newRecord.room,
        id: `r-${newRecord.room.id.toString()}`,
        roomTypeId: `rt-${newRecord.room.roomTypeId.toString()}`,
        pricePerNight: newRecord.room.pricePerNight !== null ? Number(newRecord.room.pricePerNight) : Number(newRecord.room.roomType.pricePerNight),
        capacity: newRecord.room.capacity !== null && newRecord.room.capacity !== undefined ? newRecord.room.capacity : newRecord.room.roomType.capacity,
        roomType: {
          ...newRecord.room.roomType,
          id: `rt-${newRecord.room.roomType.id.toString()}`,
          pricePerNight: Number(newRecord.room.roomType.pricePerNight)
        }
      }
    };
  },

  // 3. Cập nhật trạng thái bảo trì và tự động đồng bộ trạng thái phòng
  updateRecordStatus: async (id: string, status: string) => {
    const recordId = BigInt(id);

    // Lấy thông tin bản ghi bảo trì hiện tại
    const record = await prisma.maintenanceRecord.findUnique({
      where: { id: recordId }
    });

    if (!record) {
      throw new Error("Không tìm thấy bản ghi bảo trì");
    }

    // Các trường cập nhật thêm
    const updateData: any = { status };
    if (status === "COMPLETED") {
      updateData.endDate = new Date();
    }

    // Cập nhật trạng thái bản ghi bảo trì
    const updatedRecord = await prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: updateData,
      include: {
        room: {
          include: {
            roomType: true
          }
        }
      }
    });

    // Nghiệp vụ tự động đổi trạng thái phòng tương ứng
    let roomStatus = "MAINTENANCE";
    if (status === "COMPLETED" || status === "CANCELLED") {
      roomStatus = "AVAILABLE"; // Chuyển về sẵn sàng khi sửa xong hoặc hủy sửa
    } else {
      roomStatus = "MAINTENANCE"; // Vẫn bảo trì khi sửa hoặc chờ linh kiện
    }

    // Cập nhật trạng thái phòng thực tế trong DB
    await prisma.room.update({
      where: { id: record.roomId },
      data: { status: roomStatus }
    });

    return {
      ...updatedRecord,
      id: updatedRecord.id.toString(),
      roomId: `r-${updatedRecord.roomId.toString()}`,
      staffId: updatedRecord.staffId ? updatedRecord.staffId.toString() : null,
      repairCost: Number(updatedRecord.repairCost),
      room: {
        ...updatedRecord.room,
        id: `r-${updatedRecord.room.id.toString()}`,
        roomTypeId: `rt-${updatedRecord.room.roomTypeId.toString()}`,
        pricePerNight: updatedRecord.room.pricePerNight !== null ? Number(updatedRecord.room.pricePerNight) : Number(updatedRecord.room.roomType.pricePerNight),
        capacity: updatedRecord.room.capacity !== null && updatedRecord.room.capacity !== undefined ? updatedRecord.room.capacity : updatedRecord.room.roomType.capacity,
        roomType: {
          ...updatedRecord.room.roomType,
          id: `rt-${updatedRecord.room.roomType.id.toString()}`,
          pricePerNight: Number(updatedRecord.room.roomType.pricePerNight)
        }
      }
    };
  },

  // 4. Hoàn thành bảo trì (giữ nguyên để tránh breaking changes nếu có chỗ gọi cũ)
  completeRecord: async (id: string) => {
    return MaintenanceService.updateRecordStatus(id, "COMPLETED");
  }
};
