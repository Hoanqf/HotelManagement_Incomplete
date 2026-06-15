import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import { InvoiceService } from "./invoice.service";

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
    
    // Kiểm tra xem phòng có bị trùng lịch trong khoảng thời gian này không
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: BigInt(roomId),
        status: {
          in: ["PENDING", "CONFIRMED", "CHECKED_IN"]
        },
        checkInDate: {
          lt: checkOut
        },
        checkOutDate: {
          gt: checkIn
        }
      }
    });

    if (conflictingBooking) {
      throw new Error("Phòng đã được đặt hoặc đang sử dụng trong khoảng thời gian này");
    }

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
  },

  // 4. Lấy danh sách dịch vụ của đặt phòng
  getBookingServices: async (bookingId: string) => {
    const services = await prisma.bookingService.findMany({
      where: { bookingId: BigInt(bookingId) },
      include: { service: true }
    });
    return services.map(s => ({
      ...s,
      id: s.id.toString(),
      bookingId: s.bookingId.toString(),
      serviceId: s.serviceId.toString(),
      price: Number(s.price),
      totalAmount: Number(s.totalAmount),
      service: s.service ? {
        ...s.service,
        id: s.service.id.toString(),
        price: Number(s.service.price),
      } : null
    }));
  },

  // 5. Thêm dịch vụ vào đặt phòng
  addBookingService: async (bookingId: string, serviceId: string, quantity: number) => {
    const bId = BigInt(bookingId);
    const sId = BigInt(serviceId);
    
    const service = await prisma.service.findUnique({
      where: { id: sId }
    });
    if (!service) throw new Error("Dịch vụ không tồn tại");
    
    const price = service.price;
    const totalAmount = new Prisma.Decimal(Number(price) * quantity);
    
    const existing = await prisma.bookingService.findFirst({
      where: { bookingId: bId, serviceId: sId }
    });
    
    let result;
    if (existing) {
      const newQty = existing.quantity + quantity;
      result = await prisma.bookingService.update({
        where: { id: existing.id },
        data: {
          quantity: newQty,
          totalAmount: new Prisma.Decimal(Number(price) * newQty)
        }
      });
    } else {
      result = await prisma.bookingService.create({
        data: {
          bookingId: bId,
          serviceId: sId,
          quantity,
          price,
          totalAmount
        }
      });
    }
    
    // Đồng bộ lại tổng tiền Booking (totalAmount = Room Charge + Services Charge)
    await BookingService.syncBookingTotalAmount(bId);
    
    // Đồng bộ hóa đơn nếu đã xuất hóa đơn
    await InvoiceService.syncInvoiceWithBooking(bId);
    
    return {
      ...result,
      id: result.id.toString(),
      bookingId: result.bookingId.toString(),
      serviceId: result.serviceId.toString(),
      price: Number(result.price),
      totalAmount: Number(result.totalAmount)
    };
  },

  // 6. Xóa dịch vụ khỏi đặt phòng
  removeBookingService: async (bookingServiceId: string) => {
    const bsId = BigInt(bookingServiceId);
    const bookingService = await prisma.bookingService.findUnique({
      where: { id: bsId }
    });
    if (!bookingService) throw new Error("Dịch vụ đặt phòng không tồn tại");
    
    const bId = bookingService.bookingId;
    
    const deleted = await prisma.bookingService.delete({
      where: { id: bsId }
    });
    
    // Đồng bộ lại tổng tiền Booking
    await BookingService.syncBookingTotalAmount(bId);
    
    // Đồng bộ hóa đơn nếu đã xuất hóa đơn
    await InvoiceService.syncInvoiceWithBooking(bId);
    
    return {
      ...deleted,
      id: deleted.id.toString(),
      bookingId: deleted.bookingId.toString(),
      serviceId: deleted.serviceId.toString()
    };
  },

  // Helper để đồng bộ tổng tiền Booking
  syncBookingTotalAmount: async (bookingId: bigint) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: { include: { roomType: true } },
        bookingServices: true
      }
    });
    
    if (!booking) return;
    
    // Tính tiền phòng
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    let nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (nights <= 0) nights = 1;
    
    const pricePerNight = booking.room.pricePerNight !== null ? Number(booking.room.pricePerNight) : Number(booking.room.roomType.pricePerNight);
    const roomCharge = pricePerNight * nights;
    
    // Tính tiền dịch vụ
    const servicesCharge = booking.bookingServices.reduce((sum, bs) => sum + Number(bs.totalAmount), 0);
    
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: new Prisma.Decimal(roomCharge + servicesCharge)
      }
    });
  }
};
