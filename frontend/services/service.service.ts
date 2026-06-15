const API_URL = "http://localhost:5000/api/services";

export const ServiceAPI = {
  // 1. Lấy danh sách dịch vụ
  getServices: async () => {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error("Không thể tải danh sách dịch vụ");
    }
    return res.json();
  },

  // 2. Tạo dịch vụ mới
  createService: async (data: any) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tạo dịch vụ");
    }
    return result;
  },

  // 3. Cập nhật dịch vụ
  updateService: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể cập nhật dịch vụ");
    }
    return result;
  },

  // 4. Xóa dịch vụ
  deleteService: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể xóa dịch vụ");
    }
    return result;
  }
};
