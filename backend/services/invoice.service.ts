import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";
import { PricingService } from "./pricing.service";

// Helper function to serialize invoice data safe for JSON
const serializeInvoice = (inv: any) => {
  if (!inv) return null;
  return {
    ...inv,
    id: inv.id.toString(),
    bookingId: inv.bookingId.toString(),
    subTotal: Number(inv.subTotal),
    taxAmount: Number(inv.taxAmount),
    discount: Number(inv.discount),
    totalAmount: Number(inv.totalAmount),
    booking: inv.booking ? {
      ...inv.booking,
      id: inv.booking.id.toString(),
      roomId: inv.booking.roomId.toString(),
      userId: inv.booking.userId ? inv.booking.userId.toString() : null,
      customerId: inv.booking.customerId ? inv.booking.customerId.toString() : null,
      totalAmount: Number(inv.booking.totalAmount),
      room: inv.booking.room ? {
        ...inv.booking.room,
        id: inv.booking.room.id.toString(),
        roomTypeId: inv.booking.room.roomTypeId.toString(),
        pricePerNight: inv.booking.room.pricePerNight !== null ? Number(inv.booking.room.pricePerNight) : Number(inv.booking.room.roomType.pricePerNight),
        capacity: inv.booking.room.capacity !== null && inv.booking.room.capacity !== undefined ? inv.booking.room.capacity : inv.booking.room.roomType.capacity,
        roomType: inv.booking.room.roomType ? {
          ...inv.booking.room.roomType,
          id: inv.booking.room.roomType.id.toString(),
          pricePerNight: Number(inv.booking.room.roomType.pricePerNight),
        } : null
      } : null,
      bookingServices: inv.booking.bookingServices ? inv.booking.bookingServices.map((bs: any) => ({
        ...bs,
        id: bs.id.toString(),
        bookingId: bs.bookingId.toString(),
        serviceId: bs.serviceId.toString(),
        price: Number(bs.price),
        totalAmount: Number(bs.totalAmount),
        service: bs.service ? {
          ...bs.service,
          id: bs.service.id.toString(),
          price: Number(bs.service.price),
        } : null
      })) : []
    } : null,
    payments: inv.payments ? inv.payments.map((p: any) => ({
      ...p,
      id: p.id.toString(),
      invoiceId: p.invoiceId.toString(),
      amount: Number(p.amount)
    })) : []
  };
};

export const InvoiceService = {
  // 1. Lấy tất cả hóa đơn
  getAllInvoices: async () => {
    const invoices = await prisma.invoice.findMany({
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true,
              }
            },
            bookingServices: {
              include: {
                service: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return invoices.map(serializeInvoice);
  },

  // 2. Lấy chi tiết hóa đơn theo ID
  getInvoiceById: async (id: string) => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: BigInt(id) },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true,
              }
            },
            bookingServices: {
              include: {
                service: true
              }
            }
          }
        },
        payments: true
      }
    });

    if (!invoice) return null;
    return serializeInvoice(invoice);
  },

  // 2.5. Lấy hóa đơn theo bookingId
  getInvoiceByBookingId: async (bookingId: string) => {
    const invoice = await prisma.invoice.findUnique({
      where: { bookingId: BigInt(bookingId) },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true,
              }
            },
            bookingServices: {
              include: {
                service: true
              }
            }
          }
        },
        payments: true
      }
    });

    if (!invoice) return null;
    return serializeInvoice(invoice);
  },

  // 3. Lấy đặt phòng chưa lập hóa đơn
  getBookingsWithoutInvoice: async () => {
    // Tìm các booking chưa có hóa đơn (booking.invoice là null) và không bị hủy (status khác CANCELLED)
    const bookings = await prisma.booking.findMany({
      where: {
        invoice: null,
        NOT: {
          status: "CANCELLED"
        }
      },
      include: {
        room: {
          include: {
            roomType: true
          }
        },
        bookingServices: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return Promise.all(bookings.map(async (b) => {
      // Tính toán trước chi phí tự động qua PricingService
      const pricing = await PricingService.calculateRoomCharge(
        b.roomId,
        b.bookingType,
        b.checkInDate,
        b.checkOutDate
      );
      const roomCharge = pricing.subTotal;

      const servicesCharge = b.bookingServices.reduce((sum, bs) => sum + Number(bs.totalAmount), 0);
      const subTotal = roomCharge + servicesCharge;
      const taxAmount = 0; // Đã loại bỏ thuế theo yêu cầu
      const totalAmount = subTotal;

      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      let nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (nights <= 0) nights = 1;

      return {
        id: b.id.toString(),
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        status: b.status,
        nights,
        roomCharge,
        servicesCharge,
        subTotal,
        taxAmount,
        totalAmount,
        room: {
          id: b.room.id.toString(),
          roomNumber: b.room.roomNumber,
          roomType: {
            id: b.room.roomType.id.toString(),
            name: b.room.roomType.name,
            pricePerNight: Number(b.room.roomType.pricePerNight)
          }
        },
        bookingServices: b.bookingServices.map(bs => ({
          id: bs.id.toString(),
          name: bs.service.name,
          quantity: bs.quantity,
          price: Number(bs.price),
          totalAmount: Number(bs.totalAmount),
          unit: bs.service.unit
        }))
      };
    }));
  },

  // 4. Tạo hóa đơn mới
  createInvoice: async (data: any) => {
    const { bookingId, discount = 0, status, paymentMethod } = data;

    // Tìm thông tin đặt phòng
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: {
        room: {
          include: {
            roomType: true
          }
        },
        bookingServices: true
      }
    });

    if (!booking) {
      throw new Error("Không tìm thấy thông tin đặt phòng");
    }

    // 1. Tính tiền phòng tự động qua PricingService
    const pricing = await PricingService.calculateRoomCharge(
      booking.roomId,
      booking.bookingType,
      booking.checkInDate,
      booking.checkOutDate
    );
    const roomCharge = pricing.subTotal;

    // 2. Tính tiền dịch vụ
    const servicesCharge = booking.bookingServices.reduce((sum, bs) => sum + Number(bs.totalAmount), 0);

    // 3. Tính toán tổng hóa đơn
    const subTotal = roomCharge + servicesCharge;
    const taxAmount = 0; // Đã loại bỏ thuế theo yêu cầu
    const totalAmount = Math.max(0, subTotal - Number(discount));

    // 4. Sinh mã hóa đơn INV-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${rand}`;

    // 5. Tạo hóa đơn
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        bookingId: BigInt(bookingId),
        subTotal: new Prisma.Decimal(subTotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        discount: new Prisma.Decimal(Number(discount)),
        totalAmount: new Prisma.Decimal(totalAmount),
        status: status || "UNPAID",
        processedBy: data.processedBy || "Hệ thống",
      },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true
              }
            },
            bookingServices: {
              include: {
                service: true
              }
            }
          }
        },
        payments: true
      }
    });

    // 6. Nếu đã thanh toán trực tiếp lúc tạo, thực hiện ghi nhận giao dịch thanh toán
    if (status === "PAID") {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(totalAmount),
          paymentMethod: paymentMethod || "CASH",
          note: "Thanh toán khi xuất hóa đơn"
        }
      });
    }

    // Load lại hóa đơn đầy đủ dữ liệu (sau khi có thể đã thêm payment)
    const reloadedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true
              }
            },
            bookingServices: {
              include: {
                service: true
              }
            }
          }
        },
        payments: true
      }
    });

    return serializeInvoice(reloadedInvoice);
  },

  // 5. Thanh toán hóa đơn (hỗ trợ thanh toán toàn bộ hoặc một phần)
  payInvoice: async (id: string, data: any) => {
    const { amount, paymentMethod, note } = data;
    const cleanId = BigInt(id);

    const invoice = await prisma.invoice.findUnique({
      where: { id: cleanId },
      include: {
        payments: true
      }
    });

    if (!invoice) {
      throw new Error("Không tìm thấy hóa đơn");
    }

    // Tính toán số tiền đã thanh toán trước đó
    const totalPaidBefore = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingAmount = Number(invoice.totalAmount) - totalPaidBefore;

    if (remainingAmount <= 0) {
      throw new Error("Hóa đơn đã được thanh toán đầy đủ");
    }

    // Số tiền thanh toán thực tế: nếu không truyền thì thanh toán toàn bộ phần còn lại
    const payAmountVal = amount !== undefined && amount !== null ? Number(amount) : remainingAmount;
    if (payAmountVal <= 0) {
      throw new Error("Số tiền thanh toán phải lớn hơn 0");
    }

    // 1. Ghi nhận giao dịch thanh toán
    await prisma.payment.create({
      data: {
        invoiceId: cleanId,
        amount: new Prisma.Decimal(payAmountVal),
        paymentMethod: paymentMethod || "CASH",
        note: note || "Thanh toán hóa đơn"
      }
    });

    // 2. Tính lại tổng tiền đã thanh toán (bao gồm giao dịch vừa tạo)
    const totalPaidAfter = totalPaidBefore + payAmountVal;

    // 3. Xác định trạng thái hóa đơn mới
    let newStatus = "UNPAID";
    if (totalPaidAfter >= Number(invoice.totalAmount) - 1) {
      newStatus = "PAID";
    } else if (totalPaidAfter > 0) {
      newStatus = "PARTIALLY_PAID";
    }

    // 4. Cập nhật trạng thái hóa đơn
    const updatedInvoice = await prisma.invoice.update({
      where: { id: cleanId },
      data: {
        status: newStatus,
        processedBy: data.processedBy || invoice.processedBy
      },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true
              }
            },
            bookingServices: {
              include: {
                service: true
              }
            }
          }
        },
        payments: true
      }
    });

    return serializeInvoice(updatedInvoice);
  },

  // 6. Đồng bộ hóa đơn khi thông tin Đặt phòng thay đổi (ví dụ: Thêm/Xóa dịch vụ)
  syncInvoiceWithBooking: async (bookingId: bigint) => {
    // Tìm hóa đơn liên kết với đặt phòng
    const invoice = await prisma.invoice.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true
              }
            },
            bookingServices: true
          }
        },
        payments: true
      }
    });

    if (!invoice) return null;

    // 1. Tính toán tiền phòng tự động qua PricingService
    const pricing = await PricingService.calculateRoomCharge(
      invoice.booking.roomId,
      invoice.booking.bookingType,
      invoice.booking.checkInDate,
      invoice.booking.checkOutDate
    );
    const roomCharge = pricing.subTotal;

    // 2. Tính toán tiền dịch vụ mới
    const servicesCharge = invoice.booking.bookingServices.reduce((sum, bs) => sum + Number(bs.totalAmount), 0);

    // 3. Tính toán tổng tiền hóa đơn mới
    const subTotal = roomCharge + servicesCharge;
    const taxAmount = 0; // Đã loại bỏ thuế theo yêu cầu
    const discount = Number(invoice.discount);
    const totalAmount = Math.max(0, subTotal - discount);

    // 4. Tính toán trạng thái hóa đơn mới dựa trên số tiền đã thanh toán trước đó
    const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    let newStatus = "UNPAID";
    if (totalPaid >= totalAmount - 1) {
      newStatus = "PAID";
    } else if (totalPaid > 0) {
      newStatus = "PARTIALLY_PAID";
    }

    // 5. Cập nhật hóa đơn trong Database
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        subTotal: new Prisma.Decimal(subTotal),
        taxAmount: new Prisma.Decimal(taxAmount),
        totalAmount: new Prisma.Decimal(totalAmount),
        status: newStatus
      }
    });

    return updated;
  }
};
