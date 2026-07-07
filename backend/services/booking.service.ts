import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import { InvoiceService } from "./invoice.service";
import { PricingService } from "./pricing.service";

export const BookingService = {
  // 1. Lấy danh sách đặt phòng
  getAllBookings: async () => {
    const bookings = await prisma.booking.findMany({
      include: {
        room: {
          include: {
            roomType: true
          }
        },
        invoice: {
          include: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map(b => ({
      ...b,
      id: b.id.toString(),
      roomId: b.roomId.toString(),
      userId: b.userId ? b.userId.toString() : null,
      customerId: b.customerId ? b.customerId.toString() : null,
      room: {
        ...b.room,
        id: b.room.id.toString(),
        roomTypeId: b.room.roomTypeId.toString(),
        roomType: {
          ...b.room.roomType,
          id: b.room.roomType.id.toString(),
        }
      },
      invoice: b.invoice ? {
        ...b.invoice,
        id: b.invoice.id.toString(),
        bookingId: b.invoice.bookingId.toString(),
        subTotal: Number(b.invoice.subTotal),
        taxAmount: Number(b.invoice.taxAmount),
        discount: Number(b.invoice.discount),
        totalAmount: Number(b.invoice.totalAmount),
        payments: b.invoice.payments?.map(p => ({
          ...p,
          id: p.id.toString(),
          invoiceId: p.invoiceId.toString(),
          amount: Number(p.amount)
        }))
      } : null
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
      bookingType,
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

    // Tính tổng tiền tự động qua PricingService
    const pricing = await PricingService.calculateRoomCharge(
      roomId,
      bookingType || "DAILY",
      checkIn,
      checkOut
    );
    const totalAmount = new Prisma.Decimal(pricing.subTotal);

    // Tìm hoặc tự động tạo khách hàng dựa trên Số điện thoại
    let customer = await prisma.customer.findUnique({
      where: { phoneNumber: customerPhone }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          fullName: customerName,
          phoneNumber: customerPhone,
          email: customerEmail || null,
          nationality: data.nationality || "Việt Nam",
        }
      });
    } else {
      // Cập nhật lại thông tin nếu có thay đổi và trước đó chưa có email / nationality
      const updateData: any = {};
      if (customerName && customer.fullName !== customerName) {
        updateData.fullName = customerName;
      }
      if (customerEmail && !customer.email) {
        updateData.email = customerEmail;
      }
      if (data.nationality && customer.nationality !== data.nationality) {
        updateData.nationality = data.nationality;
      }
      if (Object.keys(updateData).length > 0) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: updateData
        });
      }
    }

    // Tạo booking code ngẫu nhiên (Ví dụ: BK-XXXX)
    const randomCode = "BK-" + Math.floor(1000 + Math.random() * 9000);

    // Tạo bản ghi đặt phòng
    const newBooking = await prisma.booking.create({
      data: {
        roomId: BigInt(roomId),
        customerId: customer.id,
        customerName,
        customerPhone,
        customerEmail: customerEmail || "",
        nationality: data.nationality || customer.nationality || "Việt Nam",
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalAmount,
        status: "PENDING", // Mặc định là PENDING
        bookingSource: bookingSource || "WALK_IN",
        bookingType: bookingType || "DAILY",
        guests: Number(guests) || 1
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
      customerId: newBooking.customerId ? newBooking.customerId.toString() : null,
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

    // Cập nhật trạng thái phòng thực tế trong DB (nếu không đang có bảo trì đang hoạt động)
    const activeMaintenance = await prisma.maintenanceRecord.findFirst({
      where: {
        roomId: booking.roomId,
        status: { in: ["PENDING", "IN_PROGRESS", "WAITING_PARTS"] }
      }
    });

    if (!activeMaintenance) {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: roomStatus }
      });
    } else {
      // Nếu đang bảo trì, đảm bảo phòng vẫn được giữ ở trạng thái MAINTENANCE trong DB
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: "MAINTENANCE" }
      });
    }

    return {
      ...updatedBooking,
      id: updatedBooking.id.toString(),
      roomId: updatedBooking.roomId.toString(),
      userId: updatedBooking.userId ? updatedBooking.userId.toString() : null,
      customerId: updatedBooking.customerId ? updatedBooking.customerId.toString() : null,
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
    
    // Tính tiền phòng qua PricingService
    const pricing = await PricingService.calculateRoomCharge(
      booking.roomId,
      booking.bookingType,
      booking.checkInDate,
      booking.checkOutDate
    );
    const roomCharge = pricing.subTotal;
    
    // Tính tiền dịch vụ
    const servicesCharge = booking.bookingServices.reduce((sum, bs) => sum + Number(bs.totalAmount), 0);
    
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: new Prisma.Decimal(roomCharge + servicesCharge)
      }
    });
  },

  // Gia hạn thời gian ở
  extendBooking: async (id: string, newCheckOutDate: Date | string) => {
    const bookingId = BigInt(id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error("Đặt phòng không tồn tại");
    }

    const checkIn = new Date(booking.checkInDate);
    const newCheckOut = new Date(newCheckOutDate);

    if (newCheckOut <= checkIn) {
      throw new Error("Thời gian trả phòng mới phải sau thời gian nhận phòng");
    }

    // Kiểm tra xem phòng có bị trùng lịch trong khoảng thời gian mới hay không (trừ chính booking này)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: booking.roomId,
        id: { not: bookingId },
        status: {
          in: ["PENDING", "CONFIRMED", "CHECKED_IN"]
        },
        checkInDate: {
          lt: newCheckOut
        },
        checkOutDate: {
          gt: checkIn
        }
      }
    });

    if (conflictingBooking) {
      throw new Error("Phòng đã được đặt hoặc đang sử dụng bởi khách khác trong khoảng thời gian gia hạn");
    }

    // Tính toán tiền phòng mới bằng PricingService
    const pricing = await PricingService.calculateRoomCharge(
      booking.roomId,
      booking.bookingType,
      checkIn,
      newCheckOut
    );

    // Tính tiền dịch vụ hiện tại để cộng dồn vào Booking.totalAmount
    const services = await prisma.bookingService.findMany({
      where: { bookingId }
    });
    const servicesCharge = services.reduce((sum, bs) => sum + Number(bs.totalAmount), 0);
    const newTotalAmount = new Prisma.Decimal(pricing.subTotal + servicesCharge);

    // Cập nhật booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        checkOutDate: newCheckOut,
        totalAmount: newTotalAmount
      },
      include: {
        room: { include: { roomType: true } }
      }
    });

    // Đồng bộ hóa đơn liên kết nếu có
    await InvoiceService.syncInvoiceWithBooking(bookingId);

    return {
      ...updated,
      id: updated.id.toString(),
      roomId: updated.roomId.toString(),
      userId: updated.userId ? updated.userId.toString() : null,
      customerId: updated.customerId ? updated.customerId.toString() : null,
      room: {
        ...updated.room,
        id: updated.room.id.toString(),
        roomTypeId: updated.room.roomTypeId.toString(),
        roomType: {
          ...updated.room.roomType,
          id: updated.room.roomType.id.toString()
        }
      }
    };
  },

  // Đổi phòng
  changeRoom: async (id: string, newRoomId: string) => {
    const bookingId = BigInt(id);
    const targetRoomId = BigInt(newRoomId);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error("Đặt phòng không tồn tại");
    }

    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);

    // Kiểm tra xem phòng mới có bị trùng lịch trong khoảng thời gian này hay không (trừ chính booking này nếu đổi lại cùng phòng cũ)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: targetRoomId,
        id: { not: bookingId },
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
      throw new Error("Phòng mới đã được đặt hoặc đang sử dụng trong khoảng thời gian này");
    }

    // Tính toán tiền phòng mới bằng PricingService
    const pricing = await PricingService.calculateRoomCharge(
      targetRoomId,
      booking.bookingType,
      checkIn,
      checkOut
    );

    // Tính tiền dịch vụ hiện tại để cộng dồn vào Booking.totalAmount
    const services = await prisma.bookingService.findMany({
      where: { bookingId }
    });
    const servicesCharge = services.reduce((sum, bs) => sum + Number(bs.totalAmount), 0);
    const newTotalAmount = new Prisma.Decimal(pricing.subTotal + servicesCharge);

    // Cập nhật booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        roomId: targetRoomId,
        totalAmount: newTotalAmount
      },
      include: {
        room: { include: { roomType: true } }
      }
    });

    // Lấy thông tin phòng cũ để kiểm tra trạng thái thực tế
    const currentRoom = await prisma.room.findUnique({
      where: { id: booking.roomId }
    });

    const now = new Date();
    
    // Nếu booking đã check-in hoặc phòng cũ đang OCCUPIED hoặc lịch ở đã bắt đầu
    const oldRoomNeedsCleaning = booking.status === "CHECKED_IN" || 
                                 (currentRoom && currentRoom.status === "OCCUPIED") ||
                                 ((booking.status === "PENDING" || booking.status === "CONFIRMED") && now >= checkIn);

    if (oldRoomNeedsCleaning) {
      const oldRoomActiveMaint = await prisma.maintenanceRecord.findFirst({
        where: {
          roomId: booking.roomId,
          status: { in: ["PENDING", "IN_PROGRESS", "WAITING_PARTS"] }
        }
      });
      if (!oldRoomActiveMaint) {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: "DIRTY" }
        });
      }
    }

    // Cập nhật trạng thái phòng mới sang OCCUPIED chỉ khi booking đã CHECKED_IN
    if (booking.status === "CHECKED_IN") {
      await prisma.room.update({
        where: { id: targetRoomId },
        data: { status: "OCCUPIED" }
      });
    }

    // Đồng bộ hóa đơn liên kết nếu có
    await InvoiceService.syncInvoiceWithBooking(bookingId);

    return {
      ...updated,
      id: updated.id.toString(),
      roomId: updated.roomId.toString(),
      userId: updated.userId ? updated.userId.toString() : null,
      customerId: updated.customerId ? updated.customerId.toString() : null,
      room: {
        ...updated.room,
        id: updated.room.id.toString(),
        roomTypeId: updated.room.roomTypeId.toString(),
        roomType: {
          ...updated.room.roomType,
          id: updated.room.roomType.id.toString()
        }
      }
    };
  }
};
