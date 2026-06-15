const API_URL = "http://localhost:5000/api/users";

// Helper function to get headers with authentication token
const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const UserAPI = {
  // 1. Lấy danh sách người dùng
  getUsers: async () => {
    const res = await fetch(API_URL, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể lấy danh sách người dùng");
    }
    return res.json();
  },

  // 2. Lấy danh sách chức vụ
  getPositions: async () => {
    const res = await fetch(`${API_URL}/positions`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể lấy danh sách chức vụ");
    }
    return res.json();
  },

  // 3. Tạo người dùng mới
  createUser: async (data: any) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tạo người dùng mới");
    }
    return result;
  },

  // 4. Lấy cấu hình Cloudinary để tải ảnh lên
  getCloudinaryConfig: async () => {
    const res = await fetch(`${API_URL}/cloudinary-config`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể lấy cấu hình Cloudinary");
    }
    return res.json();
  },

  // 5. Lấy thông tin người dùng theo ID
  getUserById: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Không thể lấy thông tin người dùng");
    }
    return res.json();
  },

  // 6. Cập nhật thông tin người dùng
  updateUser: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể cập nhật thông tin người dùng");
    }
    return result;
  },

  // 7. Tạo chức vụ mới
  createPosition: async (data: { position_name: string; description?: string }) => {
    const res = await fetch(`http://localhost:5000/api/users/positions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tạo chức vụ mới");
    }
    return result;
  },

  // 8. Đăng nhập
  login: async (data: any) => {
    const res = await fetch(`http://localhost:5000/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Đăng nhập thất bại");
    }
    return res.json();
  },

  // 9. Xóa tài khoản nhân viên
  deleteUser: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể xóa tài khoản");
    }
    return result;
  }
};