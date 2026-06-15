const API_URL = "http://localhost:5000/api/invoices";

export const InvoiceAPI = {
  // 1. Lấy danh sách hóa đơn
  getInvoices: async () => {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error("Không thể tải danh sách hóa đơn");
    }
    return res.json();
  },

  // 2. Lấy chi tiết hóa đơn
  getInvoiceById: async (id: string) => {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) {
      throw new Error("Không thể tải chi tiết hóa đơn");
    }
    return res.json();
  },

  // 3. Lấy đặt phòng chưa lập hóa đơn
  getBookingsWithoutInvoice: async () => {
    const res = await fetch(`${API_URL}/no-invoice`);
    if (!res.ok) {
      throw new Error("Không thể tải danh sách đặt phòng chưa lập hóa đơn");
    }
    return res.json();
  },

  // 4. Tạo hóa đơn mới
  createInvoice: async (data: any) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể tạo hóa đơn");
    }
    return result;
  },

  // 5. Thanh toán hóa đơn
  payInvoice: async (id: string, paymentData: any) => {
    const res = await fetch(`${API_URL}/${id}/pay`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Không thể thực hiện thanh toán");
    }
    return result;
  }
};
