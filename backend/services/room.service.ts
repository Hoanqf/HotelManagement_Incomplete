import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// Hàm làm sạch roomTypeId từ frontend (ví dụ "rt-1" -> 1)
const cleanRoomTypeId = (typeId: string | number): bigint => {
  if (typeof typeId === "string") {
    const clean = typeId.replace("rt-", "");
    return BigInt(clean);
  }
  return BigInt(typeId);
};

export const RoomService = {
  // 1. Lấy danh sách phòng (kèm theo đặt phòng đang checked-in và bảo trì đang diễn ra)
  getAllRooms: async () => {
    const rooms = await prisma.room.findMany({
      include: {
        roomType: true,
        // Lấy tất cả đặt phòng chưa hủy/thành công để xử lý lọc thời gian
        bookings: {
          where: {
            status: {
              in: ["CHECKED_IN", "CONFIRMED", "PENDING"]
            }
          },
          orderBy: {
            checkInDate: "asc"
          }
        },
        // Lấy thông tin bảo trì đang hoạt động
        maintenance: {
          where: {
            status: {
              in: ["IN_PROGRESS", "WAITING_PARTS", "PENDING"]
            }
          },
          take: 1
        }
      },
      orderBy: {
        roomNumber: "asc",
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return rooms.map(room => {
      // 1. Tìm đặt phòng đang check-in
      let activeBooking = room.bookings.find(b => b.status === "CHECKED_IN");

      // 2. Nếu không có khách đang ở, tìm đặt trước (CONFIRMED/PENDING) chưa hết hạn
      if (!activeBooking) {
        activeBooking = room.bookings.find(b => {
          const checkOut = new Date(b.checkOutDate);
          return checkOut >= todayStart;
        });
      }

      const activeBookingsList = activeBooking ? [activeBooking] : [];

      return {
        ...room,
        id: room.id.toString(),
        roomTypeId: `rt-${room.roomTypeId.toString()}`, // Định dạng lại giống mock frontend ("rt-1")
        amenities: room.amenities || [], // Tiện nghi riêng biệt của phòng
        pricePerNight: room.pricePerNight !== null ? Number(room.pricePerNight) : Number(room.roomType.pricePerNight),
        capacity: room.capacity !== null && room.capacity !== undefined ? room.capacity : room.roomType.capacity,
        roomType: {
          ...room.roomType,
          id: `rt-${room.roomType.id.toString()}`,
          pricePerNight: Number(room.roomType.pricePerNight),
          priceHourly: Number(room.roomType.priceHourly || 0),
          priceDaily: Number(room.roomType.priceDaily || 0),
          priceOvernight: Number(room.roomType.priceOvernight || 0),
          priceHourlyWeekend: Number(room.roomType.priceHourlyWeekend || 0),
          priceDailyWeekend: Number(room.roomType.priceDailyWeekend || 0),
          priceOvernightWeekend: Number(room.roomType.priceOvernightWeekend || 0),
          priceHourlyHoliday: Number(room.roomType.priceHourlyHoliday || 0),
          priceDailyHoliday: Number(room.roomType.priceDailyHoliday || 0),
          priceOvernightHoliday: Number(room.roomType.priceOvernightHoliday || 0),
          amenities: room.roomType.amenities || []
        },
        // Chỉ trả về đặt phòng đang hoạt động thực tế
        bookings: activeBookingsList.map(b => ({
          ...b,
          id: b.id.toString(),
          roomId: b.roomId.toString(),
          userId: b.userId ? b.userId.toString() : null,
          customerId: b.customerId ? b.customerId.toString() : null,
        })),
        maintenance: room.maintenance.map(m => ({
          ...m,
          id: m.id.toString(),
          roomId: m.roomId.toString(),
          staffId: m.staffId ? m.staffId.toString() : null,
        }))
      };
    });
  },

  // 1.5. Lấy danh sách loại phòng từ database
  getRoomTypes: async () => {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { id: "asc" }
    });
    return roomTypes.map(rt => ({
      ...rt,
      id: `rt-${rt.id.toString()}`,
      pricePerNight: Number(rt.pricePerNight),
      priceHourly: Number(rt.priceHourly || 0),
      priceDaily: Number(rt.priceDaily || 0),
      priceOvernight: Number(rt.priceOvernight || 0),
      priceHourlyWeekend: Number(rt.priceHourlyWeekend || 0),
      priceDailyWeekend: Number(rt.priceDailyWeekend || 0),
      priceOvernightWeekend: Number(rt.priceOvernightWeekend || 0),
      priceHourlyHoliday: Number(rt.priceHourlyHoliday || 0),
      priceDailyHoliday: Number(rt.priceDailyHoliday || 0),
      priceOvernightHoliday: Number(rt.priceOvernightHoliday || 0),
      amenities: rt.amenities || []
    }));
  },

  // 2. Tạo phòng mới
  createRoom: async (data: any) => {
    const roomTypeIdClean = cleanRoomTypeId(data.roomTypeId);

    const newRoom = await prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        floor: Number(data.floor),
        status: data.status || "AVAILABLE",
        roomTypeId: roomTypeIdClean,
        note: data.note || "",
        amenities: data.amenities || [], // Lưu tiện nghi riêng vào phòng
        pricePerNight: data.pricePerNight ? new Prisma.Decimal(Number(data.pricePerNight)) : null, // Lưu giá riêng vào phòng
        capacity: data.maxGuests ? Number(data.maxGuests) : null // Lưu công suất riêng vào phòng
      },
      include: {
        roomType: true
      }
    });

    return {
      ...newRoom,
      id: newRoom.id.toString(),
      roomTypeId: `rt-${newRoom.roomTypeId.toString()}`,
      amenities: newRoom.amenities || [], // Tiện nghi của phòng
      pricePerNight: newRoom.pricePerNight !== null ? Number(newRoom.pricePerNight) : Number(newRoom.roomType.pricePerNight),
      capacity: newRoom.capacity !== null && newRoom.capacity !== undefined ? newRoom.capacity : newRoom.roomType.capacity,
      roomType: {
        ...newRoom.roomType,
        id: `rt-${newRoom.roomType.id.toString()}`,
        pricePerNight: Number(newRoom.roomType.pricePerNight),
        amenities: newRoom.roomType.amenities || []
      }
    };
  },

  // 3. Cập nhật phòng
  updateRoom: async (id: string, data: any) => {
    const cleanId = BigInt(id.replace("r-", "")); // Làm sạch room ID nếu frontend gửi "r-101"
    const roomTypeIdClean = cleanRoomTypeId(data.roomTypeId);

    const updatedRoom = await prisma.room.update({
      where: { id: cleanId },
      data: {
        roomNumber: data.roomNumber,
        floor: Number(data.floor),
        status: data.status,
        roomTypeId: roomTypeIdClean,
        note: data.note || "",
        amenities: data.amenities || [], // Lưu tiện nghi riêng vào phòng
        pricePerNight: data.pricePerNight ? new Prisma.Decimal(Number(data.pricePerNight)) : null, // Lưu giá riêng vào phòng
        capacity: data.maxGuests ? Number(data.maxGuests) : null // Lưu công suất riêng vào phòng
      },
      include: {
        roomType: true
      }
    });

    return {
      ...updatedRoom,
      id: updatedRoom.id.toString(),
      roomTypeId: `rt-${updatedRoom.roomTypeId.toString()}`,
      amenities: updatedRoom.amenities || [], // Tiện nghi của phòng
      pricePerNight: updatedRoom.pricePerNight !== null ? Number(updatedRoom.pricePerNight) : Number(updatedRoom.roomType.pricePerNight),
      capacity: updatedRoom.capacity !== null && updatedRoom.capacity !== undefined ? updatedRoom.capacity : updatedRoom.roomType.capacity,
      roomType: {
        ...updatedRoom.roomType,
        id: `rt-${updatedRoom.roomType.id.toString()}`,
        pricePerNight: Number(updatedRoom.roomType.pricePerNight),
        amenities: updatedRoom.roomType.amenities || []
      }
    };
  },

  // 4. Xóa phòng
  deleteRoom: async (id: string) => {
    const cleanId = BigInt(id.replace("r-", ""));
    
    // Xóa tất cả các bản ghi bảo trì liên quan trước khi xóa phòng để tránh lỗi khóa ngoại
    await prisma.maintenanceRecord.deleteMany({
      where: { roomId: cleanId }
    });

    // Xóa tất cả các booking liên quan trước
    await prisma.booking.deleteMany({
      where: { roomId: cleanId }
    });

    const deletedRoom = await prisma.room.delete({
      where: { id: cleanId }
    });

    return {
      ...deletedRoom,
      id: deletedRoom.id.toString()
    };
  }
};
