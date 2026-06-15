const BASE_URL = "http://localhost:5000/api/dashboard";

export const DashboardAPI = {
  // Lấy số liệu thống kê tổng quan
  getStats: async () => {
    const res = await fetch(`${BASE_URL}/stats`);
    if (!res.ok) {
      throw new Error("Không thể tải số liệu thống kê tổng quan");
    }
    return res.json();
  },

  // Lấy danh sách thông báo từ DB
  getNotifications: async () => {
    const res = await fetch(`${BASE_URL}/notifications`);
    if (!res.ok) {
      throw new Error("Không thể tải danh sách thông báo");
    }
    return res.json();
  },

  // Lấy dữ liệu báo cáo thống kê động từ DB
  getReportStats: async () => {
    const res = await fetch(`${BASE_URL}/reports`);
    if (!res.ok) {
      throw new Error("Không thể tải báo cáo thống kê");
    }
    return res.json();
  }
};
