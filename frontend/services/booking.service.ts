const API_URL = "http://localhost:5000/api/bookings";

export const BookingAPI = {
  // 1. Lấy danh sách đặt phòng
  getBookings: async () => {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error("Không thể tải danh sách đặt phòng");
    }
    return res.json();
  },

  // 2. Tạo đặt phòng mới
  createBooking: async (data: any) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể lưu đặt phòng");
    }
    return result;
  },

  // 3. Cập nhật trạng thái đặt phòng
  updateBookingStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_URL}/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể cập nhật trạng thái");
    }
    return result;
  },

  // 4. Lấy danh sách dịch vụ của đặt phòng
  getBookingServices: async (bookingId: string) => {
    const res = await fetch(`${API_URL}/${bookingId}/services`);
    if (!res.ok) {
      throw new Error("Không thể tải danh sách dịch vụ của phòng");
    }
    return res.json();
  },

  // 5. Thêm dịch vụ vào đặt phòng
  addBookingService: async (bookingId: string, data: { serviceId: string; quantity: number }) => {
    const res = await fetch(`${API_URL}/${bookingId}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể thêm dịch vụ");
    }
    return result;
  },

  // 6. Xóa dịch vụ khỏi đặt phòng
  removeBookingService: async (bookingId: string, bookingServiceId: string) => {
    const res = await fetch(`${API_URL}/${bookingId}/services/${bookingServiceId}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể xóa dịch vụ");
    }
    return result;
  }
};
