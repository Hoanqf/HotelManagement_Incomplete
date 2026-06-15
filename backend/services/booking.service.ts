import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

export const BookingService = {
  // 1. Lấy danh sách tất cả đặt phòng
  getAllBookings: async () => {
    const bookings = await prisma.booking.findMany({
      include: {
        room: {
          include: {
            roomType: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Chuyển BigInt thành String để tránh lỗi JSON
    return bookings.map(b => ({
      ...b,
      id: b.id.toString(),
      roomId: b.roomId.toString(),
      userId: b.userId ? b.userId.toString() : null,
      room: {
        ...b.room,
        id: b.room.id.toString(),
        roomTypeId: b.room.roomTypeId.toString(),
        roomType: {
          ...b.room.roomType,
          id: b.room.roomType.id.toString(),
        }
      }
    }));
  },

  // 2. Tạo đặt phòng mới
  createBooking: async (data: any) => {
    const {
      customerName,
      customerPhone,
      customerEmail,
      checkInDate,
      checkOutDate,
      roomId,
      guests,
      bookingSource,
      note
    } = data;

    // Lấy thông tin phòng và đơn giá
    const room = await prisma.room.findUnique({
      where: { id: BigInt(roomId) },
      include: { roomType: true }
    });

    if (!room) {
      throw new Error("Phòng không tồn tại");
    }

    // Tính toán số đêm lưu trú
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    let nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (nights <= 0) nights = 1;

    // Tính tổng tiền = đơn giá phòng (hoặc loại phòng mặc định) * số đêm
    const pricePerNight = room.pricePerNight !== null ? Number(room.pricePerNight) : Number(room.roomType.pricePerNight);
    const totalAmount = new Prisma.Decimal(pricePerNight * nights);

    // Tạo booking code ngẫu nhiên (Ví dụ: BK-XXXX)
    const randomCode = "BK-" + Math.floor(1000 + Math.random() * 9000);

    // Tạo bản ghi đặt phòng
    const newBooking = await prisma.booking.create({
      data: {
        roomId: BigInt(roomId),
        customerName,
        customerPhone,
        customerEmail: customerEmail || "",
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalAmount,
        status: "PENDING", // Mặc định là PENDING
        bookingSource: bookingSource || "WALK_IN"
      },
      include: {
        room: {
          include: {
            roomType: true
          }
        }
      }
    });

    return {
      ...newBooking,
      id: newBooking.id.toString(),
      roomId: newBooking.roomId.toString(),
      userId: newBooking.userId ? newBooking.userId.toString() : null,
      room: {
        ...newBooking.room,
        id: newBooking.room.id.toString(),
        roomTypeId: newBooking.room.roomTypeId.toString(),
        roomType: {
          ...newBooking.room.roomType,
          id: newBooking.room.roomType.id.toString()
        }
      }
    };
  },

  // 3. Cập nhật trạng thái đặt phòng
  updateBookingStatus: async (id: string, status: string) => {
    // Tìm đặt phòng hiện tại
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(id) }
    });

    if (!booking) {
      throw new Error("Đặt phòng không tồn tại");
    }

    // Cập nhật trạng thái đặt phòng
    const updatedBooking = await prisma.booking.update({
      where: { id: BigInt(id) },
      data: { status },
      include: {
        room: {
          include: {
            roomType: true
          }
        }
      }
    });

    // Nghiệp vụ thay đổi trạng thái phòng tương ứng
    let roomStatus = "AVAILABLE";
    if (status === "CHECKED_IN") {
      roomStatus = "OCCUPIED";
    } else if (status === "CHECKED_OUT") {
      roomStatus = "DIRTY"; // Khách trả phòng -> phòng chuyển sang trạng thái Chưa dọn dẹp
    } else if (status === "CANCELLED") {
      roomStatus = "AVAILABLE";
    } else if (status === "CONFIRMED") {
      roomStatus = "AVAILABLE"; // hoặc tùy chỉnh theo mong muốn
    }

    // Cập nhật trạng thái phòng thực tế trong DB
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: roomStatus }
    });

    return {
      ...updatedBooking,
      id: updatedBooking.id.toString(),
      roomId: updatedBooking.roomId.toString(),
      userId: updatedBooking.userId ? updatedBooking.userId.toString() : null,
      room: {
        ...updatedBooking.room,
        id: updatedBooking.room.id.toString(),
        roomTypeId: updatedBooking.room.roomTypeId.toString(),
        roomType: {
          ...updatedBooking.room.roomType,
          id: updatedBooking.room.roomType.id.toString()
        }
      }
    };
  }
};
