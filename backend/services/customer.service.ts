import prisma from "../config/prisma";

export const CustomerService = {
  // 1. Lấy danh sách khách hàng
  getAllCustomers: async () => {
    const customers = await prisma.customer.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            checkInDate: true,
            checkOutDate: true,
            room: {
              select: {
                roomNumber: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return customers.map(c => {
      // Tính toán số lần đặt phòng và tổng doanh thu từ các booking không bị CANCELLED
      const validBookings = c.bookings.filter(b => b.status !== "CANCELLED");
      const totalSpend = validBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
      const bookingCount = c.bookings.length;

      return {
        ...c,
        id: c.id.toString(),
        totalSpend,
        bookingCount,
        bookings: c.bookings.map(b => ({
          ...b,
          id: b.id.toString(),
          roomNumber: b.room?.roomNumber || "N/A"
        }))
      };
    });
  },

  // 2. Lấy chi tiết một khách hàng theo ID
  getCustomerById: async (id: string) => {
    const c = await prisma.customer.findUnique({
      where: { id: BigInt(id) },
      include: {
        bookings: {
          include: {
            room: {
              include: {
                roomType: true
              }
            }
          },
          orderBy: { checkInDate: "desc" }
        }
      }
    });

    if (!c) return null;

    const validBookings = c.bookings.filter(b => b.status !== "CANCELLED");
    const totalSpend = validBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const bookingCount = c.bookings.length;

    return {
      ...c,
      id: c.id.toString(),
      totalSpend,
      bookingCount,
      bookings: c.bookings.map(b => ({
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
            id: b.room.roomType.id.toString()
          }
        }
      }))
    };
  },

  // 3. Tìm khách hàng theo SĐT (dùng cho gợi ý autocomplete)
  findCustomerByPhone: async (phone: string) => {
    const c = await prisma.customer.findFirst({
      where: { phoneNumber: phone },
    });
    if (!c) return null;
    return {
      ...c,
      id: c.id.toString(),
    };
  },

  // 4. Tạo khách hàng mới thủ công
  createCustomer: async (data: any) => {
    const { fullName, email, phoneNumber, nationality, identityCard, notes } = data;
    
    // Kiểm tra trùng SĐT
    const existing = await prisma.customer.findUnique({
      where: { phoneNumber },
    });
    if (existing) {
      throw new Error("Số điện thoại khách hàng này đã tồn tại trong hệ thống");
    }

    const c = await prisma.customer.create({
      data: {
        fullName,
        email: email || null,
        phoneNumber,
        nationality: nationality || "Việt Nam",
        identityCard: identityCard || null,
        notes: notes || null,
      }
    });

    return {
      ...c,
      id: c.id.toString(),
    };
  },

  // 5. Cập nhật khách hàng
  updateCustomer: async (id: string, data: any) => {
    const { fullName, email, phoneNumber, nationality, identityCard, notes } = data;

    // Kiểm tra trùng SĐT với người khác
    if (phoneNumber) {
      const existing = await prisma.customer.findFirst({
        where: {
          phoneNumber,
          NOT: { id: BigInt(id) }
        }
      });
      if (existing) {
        throw new Error("Số điện thoại khách hàng này đã tồn tại ở tài khoản khách hàng khác");
      }
    }

    const c = await prisma.customer.update({
      where: { id: BigInt(id) },
      data: {
        fullName,
        email: email !== undefined ? email : undefined,
        phoneNumber,
        nationality,
        identityCard: identityCard !== undefined ? identityCard : undefined,
        notes: notes !== undefined ? notes : undefined,
      }
    });

    return {
      ...c,
      id: c.id.toString(),
    };
  },

  // 6. Xóa khách hàng
  deleteCustomer: async (id: string) => {
    // Xóa liên kết trong Booking trước (set customerId = null)
    await prisma.booking.updateMany({
      where: { customerId: BigInt(id) },
      data: { customerId: null }
    });

    const c = await prisma.customer.delete({
      where: { id: BigInt(id) }
    });

    return {
      ...c,
      id: c.id.toString(),
    };
  }
};
