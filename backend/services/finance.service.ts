import prisma from "../config/prisma";
import { Prisma } from "@prisma/client";

// Helper function to serialize transaction data safe for JSON
const serializeTransaction = (tx: any) => {
  if (!tx) return null;
  return {
    ...tx,
    id: tx.id.toString(),
    createdById: tx.createdById.toString(),
    amount: Number(tx.amount),
    createdBy: tx.createdBy ? {
      id: tx.createdBy.id.toString(),
      fullName: tx.createdBy.fullName,
      email: tx.createdBy.email,
      role: tx.createdBy.role,
    } : null
  };
};

export const FinanceService = {
  // Tự động đồng bộ các giao dịch từ hóa đơn đã thanh toán và bảo trì hoàn thành
  syncTransactions: async () => {
    try {
      // Tìm tài khoản ADMIN làm người tạo mặc định cho các giao dịch đồng bộ
      const defaultAdmin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        orderBy: { id: "asc" }
      });
      const defaultAdminId = defaultAdmin ? defaultAdmin.id : BigInt(1);

      // 1. Đồng bộ doanh thu tiền phòng/dịch vụ từ hóa đơn đã thanh toán (PAID)
      const paidInvoices = await prisma.invoice.findMany({
        where: { status: "PAID" },
        include: { booking: true }
      });

      for (const inv of paidInvoices) {
        const txCode = `INV-PAY-${inv.invoiceNumber}`;
        const existing = await prisma.financeTransaction.findUnique({
          where: { code: txCode }
        });

        if (!existing) {
          const createdById = inv.booking?.userId || defaultAdminId;
          const customerName = inv.booking?.customerName || "Khách hàng";

          await prisma.financeTransaction.create({
            data: {
              code: txCode,
              type: "INCOME",
              category: "Tiền phòng",
              amount: inv.totalAmount,
              description: `Thu tiền thanh toán hóa đơn ${inv.invoiceNumber} - Khách: ${customerName}`,
              date: inv.updatedAt || new Date(),
              createdById
            }
          });
          console.log(`[Finance Sync] Đồng bộ thành công khoản thu từ hóa đơn: ${inv.invoiceNumber}`);
        }
      }

      // 2. Đồng bộ chi phí bảo trì phòng đã hoàn thành (repairCost > 0)
      const completedMaintenances = await prisma.maintenanceRecord.findMany({
        where: {
          status: "COMPLETED",
          repairCost: { gt: 0 }
        },
        include: { room: true }
      });

      for (const record of completedMaintenances) {
        const txCode = `MAINT-EXP-${record.id}`;
        const existing = await prisma.financeTransaction.findUnique({
          where: { code: txCode }
        });

        if (!existing) {
          const createdById = record.staffId || defaultAdminId;
          const roomNumber = record.room?.roomNumber || "N/A";

          await prisma.financeTransaction.create({
            data: {
              code: txCode,
              type: "EXPENSE",
              category: "Bảo trì",
              amount: record.repairCost,
              description: `Chi phí sửa chữa/bảo trì phòng ${roomNumber} - Lý do: ${record.description || "Bảo trì"}`,
              date: record.endDate || record.updatedAt || new Date(),
              createdById
            }
          });
          console.log(`[Finance Sync] Đồng bộ thành công khoản chi bảo trì phòng: ${roomNumber}`);
        }
      }
    } catch (error) {
      console.error("Lỗi đồng bộ dữ liệu tài chính tự động:", error);
    }
  },

  // 1. Lấy danh sách giao dịch có bộ lọc và phân trang
  getAllTransactions: async (filters: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    // Kích hoạt đồng bộ hóa dữ liệu trước khi lấy danh sách
    await FinanceService.syncTransactions();

    const { type, category, startDate, endDate, search } = filters;
    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    // Bộ lọc khoảng ngày
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    // Bộ lọc tìm kiếm theo mô tả hoặc mã giao dịch
    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const transactions = await prisma.financeTransaction.findMany({
      where: whereClause,
      include: {
        createdBy: true
      },
      orderBy: {
        date: "desc"
      }
    });

    return transactions.map(serializeTransaction);
  },

  // 2. Tạo giao dịch thu chi mới
  createTransaction: async (data: {
    type: string;
    category: string;
    amount: number;
    description?: string;
    date?: string;
    createdById: string;
  }) => {
    const { type, category, amount, description, date, createdById } = data;

    // Sinh mã giao dịch tự động: TC-[YYYYMMDD]-[RANDOM]
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const code = `TC-${dateStr}-${rand}`;

    const txDate = date ? new Date(date) : new Date();

    const newTx = await prisma.financeTransaction.create({
      data: {
        code,
        type,
        category,
        amount: new Prisma.Decimal(amount),
        description: description || "",
        date: txDate,
        createdById: BigInt(createdById)
      },
      include: {
        createdBy: true
      }
    });

    return serializeTransaction(newTx);
  },

  // 3. Xóa giao dịch thu chi (Chỉ ADMIN)
  deleteTransaction: async (id: string) => {
    return await prisma.financeTransaction.delete({
      where: { id: BigInt(id) }
    });
  },

  // 4. Lấy thống kê tổng thu, tổng chi và lợi nhuận
  getStats: async (filters: { startDate?: string; endDate?: string }) => {
    // Kích hoạt đồng bộ hóa dữ liệu trước khi thống kê
    await FinanceService.syncTransactions();

    const { startDate, endDate } = filters;
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    }

    const transactions = await prisma.financeTransaction.findMany({
      where: whereClause,
      select: {
        type: true,
        amount: true
      }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(tx => {
      const amt = Number(tx.amount);
      if (tx.type === "INCOME") {
        totalIncome += amt;
      } else if (tx.type === "EXPENSE") {
        totalExpense += amt;
      }
    });

    return {
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense
    };
  }
};
