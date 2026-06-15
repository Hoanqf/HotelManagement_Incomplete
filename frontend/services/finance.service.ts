const API_URL = "http://localhost:5000/api/finance";

// Helper function to get headers with authentication token
const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const FinanceAPI = {
  // 1. Lấy danh sách giao dịch với bộ lọc
  getTransactions: async (filters: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.category) params.append("category", filters.category);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.search) params.append("search", filters.search);

    const res = await fetch(`${API_URL}?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể tải danh sách giao dịch");
    }
    return res.json();
  },

  // 2. Tạo giao dịch mới
  createTransaction: async (data: {
    type: string;
    category: string;
    amount: number;
    description?: string;
    date?: string;
  }) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tạo giao dịch mới");
    }
    return result;
  },

  // 3. Lấy thống kê tài chính
  getStats: async (filters: { startDate?: string; endDate?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const res = await fetch(`${API_URL}/stats?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể tải thống kê tài chính");
    }
    return res.json();
  },

  // 4. Xóa giao dịch (Chỉ dành cho ADMIN)
  deleteTransaction: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể xóa giao dịch");
    }
    return result;
  }
};
