import prisma from "../config/prisma";
import bcrypt from "bcrypt";

export const SeedService = {
  seedAll: async () => {
    try {
      // 1. Kiểm tra xem đã có Loại phòng nào chưa
      const roomTypeCount = await prisma.roomType.count();
      if (roomTypeCount === 0) {
        console.log("🌱 Database trống. Đang tự động seed dữ liệu mẫu...");

        // Tạo các loại phòng
        const standardType = await prisma.roomType.create({
          data: {
            name: "Standard",
            pricePerNight: 500000,
            capacity: 2,
            description: "Phòng tiêu chuẩn đầy đủ tiện nghi cơ bản"
          }
        });

        const deluxeType = await prisma.roomType.create({
          data: {
            name: "Deluxe",
            pricePerNight: 800000,
            capacity: 3,
            description: "Phòng Deluxe cao cấp rộng rãi, có ban công hướng phố"
          }
        });

        const suiteType = await prisma.roomType.create({
          data: {
            name: "Suite",
            pricePerNight: 1500000,
            capacity: 4,
            description: "Phòng Suite hạng sang sang trọng bậc nhất, bồn tắm sục jacuzzi"
          }
        });

        console.log("✅ Đã tạo 3 loại phòng mẫu");

        // Tạo các phòng (Rooms)
        const roomsToCreate = [
          // Tầng 1: Standard
          { roomNumber: "101", roomTypeId: standardType.id, floor: 1, status: "AVAILABLE", note: "Gần thang máy" },
          { roomNumber: "102", roomTypeId: standardType.id, floor: 1, status: "AVAILABLE" },
          { roomNumber: "103", roomTypeId: standardType.id, floor: 1, status: "AVAILABLE" },
          { roomNumber: "104", roomTypeId: standardType.id, floor: 1, status: "AVAILABLE" },
          { roomNumber: "105", roomTypeId: standardType.id, floor: 1, status: "AVAILABLE" },
          { roomNumber: "106", roomTypeId: standardType.id, floor: 1, status: "AVAILABLE" },
          
          // Tầng 2: Standard & Deluxe
          { roomNumber: "201", roomTypeId: standardType.id, floor: 2, status: "AVAILABLE" },
          { roomNumber: "202", roomTypeId: standardType.id, floor: 2, status: "AVAILABLE" },
          { roomNumber: "203", roomTypeId: deluxeType.id, floor: 2, status: "AVAILABLE" },
          { roomNumber: "204", roomTypeId: deluxeType.id, floor: 2, status: "AVAILABLE" },
          { roomNumber: "205", roomTypeId: deluxeType.id, floor: 2, status: "AVAILABLE" },
          { roomNumber: "206", roomTypeId: deluxeType.id, floor: 2, status: "AVAILABLE" },

          // Tầng 3: Deluxe
          { roomNumber: "301", roomTypeId: deluxeType.id, floor: 3, status: "AVAILABLE" },
          { roomNumber: "302", roomTypeId: deluxeType.id, floor: 3, status: "AVAILABLE" },
          { roomNumber: "303", roomTypeId: deluxeType.id, floor: 3, status: "AVAILABLE" },
          { roomNumber: "304", roomTypeId: deluxeType.id, floor: 3, status: "AVAILABLE" },
          { roomNumber: "305", roomTypeId: deluxeType.id, floor: 3, status: "AVAILABLE" },
          { roomNumber: "306", roomTypeId: deluxeType.id, floor: 3, status: "AVAILABLE" },

          // Tầng 4: Suite
          { roomNumber: "401", roomTypeId: suiteType.id, floor: 4, status: "AVAILABLE" },
          { roomNumber: "402", roomTypeId: suiteType.id, floor: 4, status: "AVAILABLE" },
          { roomNumber: "403", roomTypeId: suiteType.id, floor: 4, status: "AVAILABLE" },
          { roomNumber: "404", roomTypeId: suiteType.id, floor: 4, status: "AVAILABLE" },
          { roomNumber: "405", roomTypeId: suiteType.id, floor: 4, status: "AVAILABLE" },
          { roomNumber: "406", roomTypeId: suiteType.id, floor: 4, status: "AVAILABLE" },
        ];

        for (const r of roomsToCreate) {
          await prisma.room.create({
            data: {
              roomNumber: r.roomNumber,
              roomTypeId: r.roomTypeId,
              floor: r.floor,
              status: r.status,
              note: r.note || ""
            }
          });
        }
        
        console.log(`✅ Đã seed thành công ${roomsToCreate.length} phòng vào Database`);
      }
    } catch (error) {
      console.error("❌ Lỗi khi seed dữ liệu mẫu:", error);
    }
  }
};
