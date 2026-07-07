const API_URL = "http://localhost:5000/api/customers";

// Helper function to get headers with authentication token
const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const CustomerAPI = {
  // 1. Lấy danh sách khách hàng
  getCustomers: async () => {
    const res = await fetch(API_URL, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể lấy danh sách khách hàng");
    }
    return res.json();
  },

  // 2. Lấy chi tiết khách hàng theo ID
  getCustomerById: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể lấy chi tiết khách hàng");
    }
    return res.json();
  },

  // 3. Tìm khách hàng theo SĐT (dùng cho autocomplete)
  searchCustomerByPhone: async (phone: string) => {
    const res = await fetch(`${API_URL}/search?phone=${encodeURIComponent(phone)}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Lỗi khi tìm kiếm khách hàng");
    }
    return res.json();
  },

  // 4. Tạo mới khách hàng
  createCustomer: async (data: any) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tạo khách hàng mới");
    }
    return result;
  },

  // 5. Cập nhật thông tin khách hàng
  updateCustomer: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể cập nhật thông tin khách hàng");
    }
    return result;
  },

  // 6. Xóa khách hàng
  deleteCustomer: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể xóa khách hàng");
    }
    return result;
  }
};
