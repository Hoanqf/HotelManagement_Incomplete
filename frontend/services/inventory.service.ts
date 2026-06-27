const API_URL = "http://localhost:5000/api/inventory";

// Helper function to get headers with authentication token
const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const InventoryAPI = {
  // 1. Lấy danh sách sản phẩm kho
  getItems: async () => {
    const res = await fetch(`${API_URL}/items`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể tải danh sách sản phẩm kho");
    }
    return res.json();
  },

  // 2. Tạo sản phẩm kho mới
  createItem: async (data: {
    name: string;
    sku?: string;
    category: string;
    unit: string;
    quantity?: number;
    minQuantity?: number;
    costPrice?: number;
    sellingPrice?: number;
    description?: string;
  }) => {
    const res = await fetch(`${API_URL}/items`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tạo sản phẩm kho mới");
    }
    return result.data;
  },

  // 3. Cập nhật sản phẩm kho
  updateItem: async (id: string, data: {
    name: string;
    sku?: string;
    category: string;
    unit: string;
    minQuantity?: number;
    costPrice?: number;
    sellingPrice?: number;
    description?: string;
  }) => {
    const res = await fetch(`${API_URL}/items/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể cập nhật sản phẩm kho");
    }
    return result.data;
  },

  // 4. Xóa sản phẩm kho
  deleteItem: async (id: string) => {
    const res = await fetch(`${API_URL}/items/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể xóa sản phẩm kho");
    }
    return result;
  },

  // 5. Lấy lịch sử giao dịch kho
  getTransactions: async (filters: {
    type?: string;
    itemId?: string;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.itemId) params.append("itemId", filters.itemId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const res = await fetch(`${API_URL}/transactions?${params.toString()}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể tải lịch sử giao dịch kho");
    }
    return res.json();
  },

  // 6. Nhập kho
  importStock: async (data: {
    itemId: string;
    quantity: number;
    price: number;
    reason?: string;
    referenceId?: string;
  }) => {
    const res = await fetch(`${API_URL}/import`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể thực hiện nhập kho");
    }
    return result.data;
  },

  // 7. Xuất kho
  exportStock: async (data: {
    itemId: string;
    quantity: number;
    reason?: string;
    referenceId?: string;
  }) => {
    const res = await fetch(`${API_URL}/export`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể thực hiện xuất kho");
    }
    return result.data;
  }
};
