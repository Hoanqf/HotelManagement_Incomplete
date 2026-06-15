const API_URL = "http://localhost:5000/api/maintenance";

export const MaintenanceAPI = {
  // 1. Lấy danh sách lịch sử bảo trì
  getMaintenanceRecords: async () => {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error("Không thể tải danh sách lịch sử bảo trì");
    }
    return res.json();
  },

  // 2. Tạo yêu cầu bảo trì mới
  createMaintenanceRecord: async (data: any) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tạo yêu cầu bảo trì");
    }
    return result;
  },

  // 3. Đánh dấu hoàn tất bảo trì
  completeMaintenanceRecord: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}/complete`, {
      method: "PUT",
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể hoàn tất bảo trì");
    }
    return result;
  },

  // 4. Cập nhật trạng thái bảo trì chi tiết
  updateMaintenanceStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể cập nhật trạng thái bảo trì");
    }
    return result;
  }
};
