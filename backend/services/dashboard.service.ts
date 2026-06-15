import prisma from "../config/prisma";

export const DashboardService = {
  getStats: async () => {
    const totalRooms = await prisma.room.count();
    const availableRooms = await prisma.room.count({
      where: { status: "AVAILABLE" }
    });
    const occupiedRooms = await prisma.room.count({
      where: { status: "OCCUPIED" }
    });
    const dirtyRooms = await prisma.room.count({
      where: { status: "DIRTY" }
    });
    const maintenanceRooms = await prisma.room.count({
      where: { status: "MAINTENANCE" }
    });

    const activeBookings = await prisma.booking.count({
      where: {
        status: {
          in: ["CHECKED_IN", "CONFIRMED"]
        }
      }
    });

    const checkedInBookings = await prisma.booking.findMany({
      where: {
        status: "CHECKED_IN"
      },
      select: {
        totalAmount: true
      }
    });

    const todayRevenue = checkedInBookings.reduce(
      (sum, b) => sum + Number(b.totalAmount),
      0
    );

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      dirtyRooms,
      maintenanceRooms,
      activeBookings,
      todayRevenue,
      occupancyRate
    };
  },

  // Lấy dữ liệu báo cáo thống kê nâng cao
  getReportStats: async () => {
    // 1. Số liệu tổng quan hôm nay
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayIncomeTx = await prisma.financeTransaction.aggregate({
      where: {
        type: "INCOME",
        date: { gte: todayStart, lte: todayEnd }
      },
      _sum: { amount: true }
    });
    const todayRevenueVal = Number(todayIncomeTx._sum.amount || 0);

    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date();
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdayIncomeTx = await prisma.financeTransaction.aggregate({
      where: {
        type: "INCOME",
        date: { gte: yesterdayStart, lte: yesterdayEnd }
      },
      _sum: { amount: true }
    });
    const yesterdayRevenueVal = Number(yesterdayIncomeTx._sum.amount || 0);

    let revenueComparisonText = "";
    if (yesterdayRevenueVal > 0) {
      const percentage = Math.round(((todayRevenueVal - yesterdayRevenueVal) / yesterdayRevenueVal) * 100);
      revenueComparisonText = percentage >= 0 ? `+${percentage}% so với hôm qua` : `${percentage}% so với hôm qua`;
    } else {
      revenueComparisonText = todayRevenueVal > 0 ? "+100% so với hôm qua" : "0% so với hôm qua";
    }

    // Tổng đặt phòng trong tháng này
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const currentMonthBookingsCount = await prisma.booking.count({
      where: {
        createdAt: { gte: monthStart }
      }
    });

    // Công suất phòng hiện tại
    const totalRooms = await prisma.room.count();
    const occupiedRooms = await prisma.room.count({
      where: { status: "OCCUPIED" }
    });
    const occupancyRateVal = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Số phòng đang có khách ở (Số đơn lưu trú)
    const checkedInRooms = await prisma.booking.count({
      where: { status: "CHECKED_IN" }
    });

    // 2. Doanh thu & Chi phí 6 tháng gần nhất
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const transactions = await prisma.financeTransaction.findMany({
      where: {
        date: { gte: sixMonthsAgo }
      },
      select: {
        type: true,
        amount: true,
        date: true
      }
    });

    const monthNames = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    const last6MonthsData: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      last6MonthsData.push({
        month: monthNames[monthIndex],
        monthNum: monthIndex,
        year: year,
        revenue: 0,
        expense: 0,
        profit: 0
      });
    }

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const txMonth = txDate.getMonth();
      const txYear = txDate.getFullYear();
      
      const monthBucket = last6MonthsData.find(item => item.monthNum === txMonth && item.year === txYear);
      if (monthBucket) {
        const amount = Number(tx.amount);
        if (tx.type === "INCOME") {
          monthBucket.revenue += amount;
        } else if (tx.type === "EXPENSE") {
          monthBucket.expense += amount;
        }
      }
    });

    last6MonthsData.forEach(item => {
      item.profit = item.revenue - item.expense;
    });

    // 3. Phân tích nguồn đặt phòng
    const bookingsBySource = await prisma.booking.groupBy({
      by: ["bookingSource"],
      _count: { id: true }
    });

    const totalBookingsCount = bookingsBySource.reduce((sum, item) => sum + item._count.id, 0);
    const sourceMap: Record<string, string> = {
      WALK_IN: "Trực tiếp (Walk-in)",
      BOOKING_COM: "Booking.com",
      AGODA: "Agoda",
      AIRBNB: "Airbnb",
      WEBSITE: "Website"
    };

    const bookingSourcesData = Object.keys(sourceMap).map(key => {
      const found = bookingsBySource.find(item => item.bookingSource === key);
      const count = found ? found._count.id : 0;
      const percentage = totalBookingsCount > 0 ? Math.round((count / totalBookingsCount) * 100) : 0;
      return {
        source: sourceMap[key],
        value: percentage,
        count
      };
    });

    // Sắp xếp theo tỷ lệ giảm dần
    bookingSourcesData.sort((a, b) => b.value - a.value);

    // 4. Báo cáo giao dịch tài chính gần đây
    const recentTx = await prisma.financeTransaction.findMany({
      take: 6,
      orderBy: { date: "desc" }
    });

    const recentReportsData = recentTx.map(tx => ({
      name: `${tx.type === "INCOME" ? "Phiếu thu" : "Phiếu chi"} - ${tx.category} (${tx.code})`,
      date: tx.date.toLocaleDateString("vi-VN"),
      status: "Hoàn thành",
      amount: Number(tx.amount),
      type: tx.type
    }));

    return {
      stats: [
        {
          title: "Doanh thu hôm nay",
          value: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(todayRevenueVal),
          description: revenueComparisonText,
          iconName: "DollarSign"
        },
        {
          title: "Tổng đặt phòng",
          value: currentMonthBookingsCount.toString(),
          description: "Đơn đặt trong tháng này",
          iconName: "CalendarCheck"
        },
        {
          title: "Công suất phòng",
          value: `${occupancyRateVal}%`,
          description: "Tỷ lệ phòng đang sử dụng",
          iconName: "Hotel"
        },
        {
          title: "Số phòng đang ở",
          value: checkedInRooms.toString(),
          description: "Phòng đang có khách lưu trú",
          iconName: "Users"
        }
      ],
      revenueData: last6MonthsData.map(item => ({
        month: item.month,
        revenue: item.revenue,
        expense: item.expense,
        profit: item.profit
      })),
      bookingSources: bookingSourcesData,
      recentReports: recentReportsData
    };
  },

  getNotifications: async () => {
    // 1. Lấy 15 đặt phòng được cập nhật gần nhất
    const bookings = await prisma.booking.findMany({
      take: 15,
      orderBy: { updatedAt: "desc" },
      include: {
        room: true
      }
    });

    // 2. Lấy 15 bản ghi bảo trì được cập nhật gần nhất
    const maintenances = await prisma.maintenanceRecord.findMany({
      take: 15,
      orderBy: { updatedAt: "desc" },
      include: {
        room: true
      }
    });

    const list: any[] = [];

    // Chuyển đổi đặt phòng thành thông báo
    bookings.forEach(b => {
      const timeStr = b.updatedAt.toISOString();
      const timeMs = b.updatedAt.getTime();

      if (b.status === "PENDING") {
        list.push({
          id: `b-pending-${b.id}-${timeMs}`,
          title: "Đặt phòng mới 🔑",
          content: `Khách ${b.customerName} đã tạo đơn đặt phòng mới (Phòng ${b.room.roomNumber}).`,
          time: timeStr,
          read: false
        });
      } else if (b.status === "CHECKED_IN") {
        list.push({
          id: `b-checkin-${b.id}-${timeMs}`,
          title: "Khách nhận phòng 🚪",
          content: `Khách ${b.customerName} đã nhận phòng ${b.room.roomNumber}.`,
          time: timeStr,
          read: false
        });
      } else if (b.status === "CHECKED_OUT") {
        list.push({
          id: `b-checkout-${b.id}-${timeMs}`,
          title: "Khách trả phòng 🧹",
          content: `Khách ${b.customerName} đã trả phòng ${b.room.roomNumber}. Phòng cần được dọn dẹp.`,
          time: timeStr,
          read: false
        });
      } else if (b.status === "CANCELLED") {
        list.push({
          id: `b-cancelled-${b.id}-${timeMs}`,
          title: "Hủy đặt phòng ❌",
          content: `Đơn đặt phòng của khách ${b.customerName} (Phòng ${b.room.roomNumber}) đã bị hủy.`,
          time: timeStr,
          read: false
        });
      }
    });

    // Chuyển đổi bảo trì thành thông báo
    maintenances.forEach(m => {
      const timeStr = m.updatedAt.toISOString();
      const timeMs = m.updatedAt.getTime();

      if (m.status === "IN_PROGRESS" || m.status === "WAITING_PARTS") {
        const statusText = m.status === "IN_PROGRESS" ? "đang sửa chữa" : "đang chờ linh kiện";
        list.push({
          id: `m-active-${m.id}-${timeMs}`,
          title: "Bảo trì phòng 🛠️",
          content: `Phòng ${m.room.roomNumber} ${statusText}: ${m.description || "Chưa có mô tả"}.`,
          time: m.createdAt.toISOString(), // Giữ nguyên ngày bắt đầu bảo trì
          read: false
        });
      } else if (m.status === "COMPLETED") {
        list.push({
          id: `m-completed-${m.id}-${timeMs}`,
          title: "Bảo trì hoàn thành ✅",
          content: `Yêu cầu bảo trì phòng ${m.room.roomNumber} đã hoàn thành.`,
          time: timeStr,
          read: false
        });
      }
    });

    // Sắp xếp danh sách thông báo theo thời gian giảm dần
    list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Chỉ lấy 15 thông báo mới nhất
    return list.slice(0, 15);
  }
};
