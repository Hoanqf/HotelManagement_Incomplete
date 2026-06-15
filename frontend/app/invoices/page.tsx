"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { InvoiceAPI } from "@/services/invoice.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  Plus,
  Eye,
  Printer,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Calendar,
  User,
  Search,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

// Currency Formatting Helper
function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

// Date Formatting Helper
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function getStatusLabel(status: string) {
  if (status === "PAID") return "Đã thanh toán";
  if (status === "PARTIALLY_PAID") return "Thanh toán một phần";
  if (status === "UNPAID") return "Chưa thanh toán";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
}

function getBookingStatusLabel(status: string) {
  if (status === "PENDING") return "Chờ xác nhận";
  if (status === "CONFIRMED") return "Đã xác nhận";
  if (status === "CHECKED_IN") return "Đã nhận phòng";
  if (status === "CHECKED_OUT") return "Đã trả phòng";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
}

function getStatusClass(status: string) {
  if (status === "PAID") return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
  if (status === "PARTIALLY_PAID") return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  if (status === "UNPAID") return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  if (status === "CANCELLED") return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  return "bg-muted text-muted-foreground";
}

function getPaymentMethodLabel(method: string) {
  if (method === "CASH") return "Tiền mặt";
  if (method === "TRANSFER") return "Chuyển khoản";
  if (method === "CARD") return "Thẻ ngân hàng";
  return method || "Chưa thanh toán";
}

export default function InvoicesPage() {
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [bookingsWithoutInvoice, setBookingsWithoutInvoice] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Invoice Modal State
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [invoiceStatus, setInvoiceStatus] = useState("UNPAID");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [submitting, setSubmitting] = useState(false);

  // Pay Invoice Modal State
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [payInvoiceNumber, setPayInvoiceNumber] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("CASH");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [selectedPayInvoice, setSelectedPayInvoice] = useState<any>(null);

  // View Invoice Modal State
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);

  // Load Invoices and Bookings without Invoice
  const loadData = async () => {
    setLoading(true);
    try {
      const [invoices, bookingsNoInvoice] = await Promise.all([
        InvoiceAPI.getInvoices(),
        InvoiceAPI.getBookingsWithoutInvoice(),
      ]);
      setInvoicesList(invoices);
      setBookingsWithoutInvoice(bookingsNoInvoice);
    } catch (error: any) {
      toast.error("Không thể tải danh sách hóa đơn từ máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected booking details when dropdown changes
  useEffect(() => {
    if (selectedBookingId) {
      const details = bookingsWithoutInvoice.find(
        (b) => b.id === selectedBookingId
      );
      setSelectedBookingDetails(details || null);
    } else {
      setSelectedBookingDetails(null);
    }
  }, [selectedBookingId, bookingsWithoutInvoice]);

  // Handle Create Invoice Submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) {
      toast.error("Vui lòng chọn đặt phòng để xuất hóa đơn");
      return;
    }

    setSubmitting(true);
    try {
      await InvoiceAPI.createInvoice({
        bookingId: selectedBookingId,
        discount: Number(discountAmount),
        status: invoiceStatus,
        paymentMethod: invoiceStatus === "PAID" ? paymentMethod : undefined,
      });

      toast.success("Tạo hóa đơn thành công!");
      setOpenCreateDialog(false);
      // Reset form
      setSelectedBookingId("");
      setSelectedBookingDetails(null);
      setDiscountAmount(0);
      setInvoiceStatus("UNPAID");
      setPaymentMethod("CASH");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tạo hóa đơn");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Open Payment Dialog
  const handleOpenPayDialog = (invoice: any) => {
    setSelectedPayInvoice(invoice);
    setPayInvoiceId(invoice.id);
    setPayInvoiceNumber(invoice.invoiceNumber);
    
    // Tính toán số tiền còn thiếu để điền sẵn vào form
    const totalPaid = invoice.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
    const remaining = Number(invoice.totalAmount) - totalPaid;
    setPayAmount(remaining > 0 ? remaining : 0);
    
    setPayMethod("CASH");
    setPayNote("Thanh toán hóa đơn");
    setOpenPayDialog(true);
  };

  // Handle Pay Invoice Submission
  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    try {
      await InvoiceAPI.payInvoice(payInvoiceId, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
        note: payNote,
      });

      toast.success("Thanh toán hóa đơn thành công!");
      setOpenPayDialog(false);
      setSelectedPayInvoice(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi thực hiện thanh toán");
    } finally {
      setPaying(false);
    }
  };

  // Handle Print Action
  const handlePrint = (invoice: any) => {
    setActiveInvoice(invoice);
    setTimeout(() => {
      window.print();
    }, 200);
  };



  // Calculations for stats
  const totalRevenue = invoicesList
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const unpaidAmount = invoicesList
    .filter((inv) => inv.status === "UNPAID")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Filtered Invoices
  const filteredInvoices = invoicesList.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.booking?.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.booking?.room?.roomNumber || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === "ALL" ? true : inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Render Invoice Template (for screen preview and print area)
  const renderInvoiceTemplate = (invoice: any, isPrint: boolean) => {
    if (!invoice) return null;
    return (
      <div
        id={isPrint ? "print-area" : "preview-area"}
        className={
          isPrint
            ? "hidden print:block bg-white text-black p-8 w-full font-sans"
            : "border rounded-lg p-6 bg-card text-card-foreground shadow-sm font-sans w-full"
        }
      >
        {/* Receipt Header */}
        <div className="flex flex-col items-center text-center border-b pb-4 mb-4">
          <h3 className="text-xl font-bold uppercase tracking-wider text-primary">Khách Sạn PMS Luxury</h3>
          <p className="text-xs text-muted-foreground">123 Đường Láng, Quận Đống Đa, Hà Nội</p>
          <p className="text-xs text-muted-foreground">Điện thoại: 0987.654.321 | Email: contact@pmsluxury.com</p>
          <div className="mt-4 text-lg font-bold tracking-tight uppercase">Hóa Đơn Thanh Toán</div>
          <p className="text-xs font-mono text-muted-foreground">Số: {invoice.invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">Ngày lập: {formatDate(invoice.createdAt)}</p>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-b pb-4">
          <div>
            <span className="text-muted-foreground block">Khách hàng:</span>
            <strong className="text-sm">{invoice.booking?.customerName}</strong>
            <span className="block text-muted-foreground">SĐT: {invoice.booking?.customerPhone}</span>
            {invoice.booking?.customerEmail && (
              <span className="block text-muted-foreground">Email: {invoice.booking?.customerEmail}</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block">Thông tin phòng:</span>
            <strong className="text-sm">Phòng {invoice.booking?.room?.roomNumber}</strong>
            <span className="block text-muted-foreground">Loại: {invoice.booking?.room?.roomType?.name}</span>
            <span className="block text-muted-foreground">
              Thời gian: {formatDate(invoice.booking?.checkInDate)} - {formatDate(invoice.booking?.checkOutDate)}
            </span>
          </div>
        </div>

        {/* Billing details table */}
        <div className="mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b font-semibold text-muted-foreground">
                <th className="py-2">Nội dung thanh toán</th>
                <th className="py-2 text-center">Đơn vị</th>
                <th className="py-2 text-center">Số lượng</th>
                <th className="py-2 text-right">Đơn giá</th>
                <th className="py-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {/* Room Charge Row */}
              <tr className="border-b">
                <td className="py-2.5">
                  <div>Tiền phòng lưu trú</div>
                  <div className="text-[10px] text-muted-foreground">
                    Từ {formatDate(invoice.booking?.checkInDate)} đến {formatDate(invoice.booking?.checkOutDate)}
                  </div>
                </td>
                <td className="py-2.5 text-center">Đêm</td>
                <td className="py-2.5 text-center">
                  {(() => {
                    const checkIn = new Date(invoice.booking?.checkInDate);
                    const checkOut = new Date(invoice.booking?.checkOutDate);
                    const timeDiff = checkOut.getTime() - checkIn.getTime();
                    let nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    return nights <= 0 ? 1 : nights;
                  })()}
                </td>
                <td className="py-2.5 text-right">
                  {formatCurrency(invoice.booking?.room?.roomType?.pricePerNight || 0)}
                </td>
                <td className="py-2.5 text-right font-medium">
                  {formatCurrency(
                    (() => {
                      const checkIn = new Date(invoice.booking?.checkInDate);
                      const checkOut = new Date(invoice.booking?.checkOutDate);
                      const timeDiff = checkOut.getTime() - checkIn.getTime();
                      let nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
                      if (nights <= 0) nights = 1;
                      return (invoice.booking?.room?.roomType?.pricePerNight || 0) * nights;
                    })()
                  )}
                </td>
              </tr>

              {/* Services Rows */}
              {invoice.booking?.bookingServices && invoice.booking.bookingServices.map((bs: any) => (
                <tr key={bs.id} className="border-b">
                  <td className="py-2.5">Dịch vụ: {bs.service?.name || "Dịch vụ phòng"}</td>
                  <td className="py-2.5 text-center">{bs.service?.unit || "Lượt"}</td>
                  <td className="py-2.5 text-center">{bs.quantity}</td>
                  <td className="py-2.5 text-right">{formatCurrency(bs.price)}</td>
                  <td className="py-2.5 text-right font-medium">{formatCurrency(bs.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subtotal, tax, discount, total */}
        <div className="flex flex-col items-end border-t pt-4 text-xs space-y-1.5">
          <div className="flex justify-between w-64">
            <span className="text-muted-foreground">Cộng tiền phòng & dịch vụ:</span>
            <span className="font-medium">{formatCurrency(invoice.subTotal)}</span>
          </div>
          <div className="flex justify-between w-64">
            <span className="text-muted-foreground">Thuế VAT (10%):</span>
            <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between w-64 text-red-600 dark:text-red-400">
              <span>Giảm giá / Khấu trừ:</span>
              <span>-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between w-64 text-sm font-bold border-t pt-2 text-primary">
            <span>Tổng cộng thanh toán:</span>
            <span>{formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>

        {/* Payment History */}
        <div className="mt-6 border-t pt-4 text-xs">
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <div>
              <span className="text-muted-foreground block mb-0.5">Trạng thái thanh toán:</span>
              <strong>
                <span className={
                  invoice.status === "PAID" 
                    ? "text-green-600 font-bold text-sm" 
                    : invoice.status === "PARTIALLY_PAID"
                    ? "text-blue-600 font-bold text-sm"
                    : "text-amber-600 font-bold text-sm"
                }>
                  {getStatusLabel(invoice.status).toUpperCase()}
                </span>
              </strong>
              
              {invoice.payments && invoice.payments.length > 0 && (
                <div className="mt-2 space-y-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                    Lịch sử giao dịch:
                  </span>
                  {invoice.payments.map((p: any, idx: number) => (
                    <div key={p.id || idx} className="text-[11px] text-foreground/80">
                      • Lần {idx + 1}: <span className="font-semibold">{formatCurrency(p.amount)}</span> ({getPaymentMethodLabel(p.paymentMethod)}) - <span className="text-muted-foreground text-[10px]">{formatDate(p.paidAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {invoice.payments && invoice.payments.length > 0 && (
              <div className="text-right space-y-1">
                <div className="flex justify-between w-60 ml-auto">
                  <span className="text-muted-foreground">Tổng tiền hóa đơn:</span>
                  <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-60 ml-auto text-emerald-600 dark:text-emerald-400">
                  <span className="text-muted-foreground">Tổng đã thanh toán:</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                  </span>
                </div>
                {invoice.totalAmount - invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0) > 0 && (
                  <div className="flex justify-between w-60 ml-auto text-primary font-bold border-t pt-1">
                    <span>Còn lại chưa trả:</span>
                    <span>
                      {formatCurrency(invoice.totalAmount - invoice.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0))}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Notes */}
        <div className="mt-12 text-center text-[10px] text-muted-foreground border-t pt-4 italic">
          Cảm ơn quý khách đã lựa chọn PMS Luxury. Hẹn gặp lại quý khách!
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      {/* Global CSS Style to override layout for clean invoice printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all screen components */
          body * {
            visibility: hidden;
          }
          /* Show only the printable container */
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Force page background to white and clear constraints */
          html, body {
            background-color: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Prevent layout cropping on flex screens */
          .flex.h-screen {
            height: auto !important;
            overflow: visible !important;
          }
        }
      ` }} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Hóa đơn"
          subtitle="Quản lý hóa đơn, thanh toán và doanh thu khách sạn"
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">Quản lý hóa đơn</h2>
              <p className="text-sm text-muted-foreground">
                Theo dõi và xử lý hóa đơn của khách hàng lưu trú tại khách sạn
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="mr-2 size-4" />
                Làm mới
              </Button>
              <Button onClick={() => setOpenCreateDialog(true)}>
                <Plus className="mr-2 size-4" />
                Tạo hóa đơn
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                  <Receipt className="size-6 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng số hóa đơn</p>
                  <h3 className="text-2xl font-bold">{invoicesList.length}</h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
                  <TrendingUp className="size-6 text-green-700 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doanh thu đã thu</p>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalRevenue)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-950">
                  <CreditCard className="size-6 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng tiền chưa thu</p>
                  <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(unpaidAmount)}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo số hóa đơn, tên khách, số phòng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="PAID">Đã thanh toán</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Thanh toán một phần</SelectItem>
                  <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Danh sách hóa đơn
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-40 items-center justify-center gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Đang tải dữ liệu...</span>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center p-4 text-center">
                  <p className="text-muted-foreground">Không tìm thấy hóa đơn nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-4 text-left font-semibold">Mã hóa đơn</th>
                        <th className="p-4 text-left font-semibold">Khách hàng</th>
                        <th className="p-4 text-left font-semibold">Phòng</th>
                        <th className="p-4 text-left font-semibold">Thời gian lưu trú</th>
                        <th className="p-4 text-left font-semibold">Tổng tiền</th>
                        <th className="p-4 text-left font-semibold">Hình thức</th>
                        <th className="p-4 text-left font-semibold">Trạng thái</th>
                        <th className="p-4 text-right font-semibold">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b hover:bg-muted/40 transition-colors">
                          <td className="p-4 font-medium">{inv.invoiceNumber}</td>
                          <td className="p-4">{inv.booking?.customerName || "N/A"}</td>
                          <td className="p-4">
                            <Badge variant="outline">
                              Phòng {inv.booking?.room?.roomNumber || "N/A"}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-xs font-semibold">
                                {formatDate(inv.booking?.checkInDate)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                đến {formatDate(inv.booking?.checkOutDate)}
                              </p>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-foreground">
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td className="p-4">
                            {inv.payments && inv.payments.length > 0 ? (
                              <span className="text-xs">
                                {Array.from(new Set(inv.payments.map((p: any) => getPaymentMethodLabel(p.paymentMethod)))).join(", ")}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">Chưa thanh toán</span>
                            )}
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusClass(inv.status)}>
                              {getStatusLabel(inv.status)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              {(inv.status === "UNPAID" || inv.status === "PARTIALLY_PAID") && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleOpenPayDialog(inv)}
                                >
                                  Thanh toán
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => {
                                  setActiveInvoice(inv);
                                  setOpenViewDialog(true);
                                }}
                              >
                                <Eye className="mr-1 size-3.5" />
                                Xem
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => handlePrint(inv)}
                              >
                                <Printer className="mr-1 size-3.5" />
                                In
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* CREATE INVOICE DIALOG */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo hóa đơn mới</DialogTitle>
            <DialogDescription>
              Lập hóa đơn thanh toán cho các đặt phòng chưa xuất hóa đơn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-select">Chọn phòng đặt</Label>
              <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng đặt (Tên khách - Số phòng)" />
                </SelectTrigger>
                <SelectContent>
                  {bookingsWithoutInvoice.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      Phòng {b.room.roomNumber} - {b.customerName} ({getBookingStatusLabel(b.status)})
                    </SelectItem>
                  ))}
                  {bookingsWithoutInvoice.length === 0 && (
                    <SelectItem value="none" disabled>
                      Không có phòng nào đang chờ lập hóa đơn
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Display computed details of selected booking */}
            {selectedBookingDetails && (
              <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Khách hàng</span>
                    <strong className="flex items-center gap-1">
                      <User className="size-3.5 text-muted-foreground" />
                      {selectedBookingDetails.customerName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Phòng / Loại phòng</span>
                    <strong>
                      Phòng {selectedBookingDetails.room.roomNumber} ({selectedBookingDetails.room.roomType.name})
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Thời gian lưu trú</span>
                    <strong className="flex items-center gap-1">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {formatDate(selectedBookingDetails.checkInDate)} - {formatDate(selectedBookingDetails.checkOutDate)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Số đêm lưu trú</span>
                    <strong>{selectedBookingDetails.nights} đêm</strong>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Tiền phòng ({selectedBookingDetails.nights} đêm)</span>
                    <span>{formatCurrency(selectedBookingDetails.roomCharge)}</span>
                  </div>

                  {/* Booking services detail list */}
                  {selectedBookingDetails.bookingServices && selectedBookingDetails.bookingServices.length > 0 && (
                    <div className="mt-2 space-y-1 pl-3 border-l-2 border-primary/20">
                      <span className="text-xs text-muted-foreground block font-medium">Dịch vụ bổ sung:</span>
                      {selectedBookingDetails.bookingServices.map((bs: any) => (
                        <div key={bs.id} className="flex justify-between text-xs text-muted-foreground">
                          <span>{bs.name} (x{bs.quantity} {bs.unit || "Lượt"})</span>
                          <span>{formatCurrency(bs.totalAmount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between text-sm pt-2">
                    <span>Tổng tiền dịch vụ</span>
                    <span>{formatCurrency(selectedBookingDetails.servicesCharge)}</span>
                  </div>

                  <div className="flex justify-between text-sm border-t pt-2 font-medium">
                    <span>Tạm tính (Subtotal)</span>
                    <span>{formatCurrency(selectedBookingDetails.subTotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Thuế VAT (10%)</span>
                    <span>{formatCurrency(selectedBookingDetails.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-1">
                    <Label htmlFor="discount-input">Giảm giá / Khấu trừ (VND)</Label>
                    <Input
                      id="discount-input"
                      type="number"
                      className="w-32 h-8 text-right font-medium"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      min={0}
                    />
                  </div>

                  <div className="flex justify-between text-base font-bold border-t pt-2 text-primary">
                    <span>Tổng tiền hóa đơn</span>
                    <span>
                      {formatCurrency(
                        Math.max(0, selectedBookingDetails.subTotal + selectedBookingDetails.taxAmount - discountAmount)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-select">Trạng thái thanh toán</Label>
                <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                  <SelectTrigger id="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNPAID">Chưa thanh toán</SelectItem>
                    <SelectItem value="PAID">Đã thanh toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {invoiceStatus === "PAID" && (
                <div className="space-y-2">
                  <Label htmlFor="method-select">Phương thức thanh toán</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="method-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Tiền mặt</SelectItem>
                      <SelectItem value="TRANSFER">Chuyển khoản</SelectItem>
                      <SelectItem value="CARD">Thẻ ngân hàng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreateDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting || !selectedBookingId}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Tạo hóa đơn
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PAY INVOICE DIALOG */}
      <Dialog open={openPayDialog} onOpenChange={setOpenPayDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thanh toán hóa đơn</DialogTitle>
            <DialogDescription>
              Thực hiện thanh toán cho hóa đơn <span className="font-semibold">{payInvoiceNumber}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePayInvoice} className="space-y-4">
            {(() => {
              const totalAmt = selectedPayInvoice ? Number(selectedPayInvoice.totalAmount) : 0;
              const totalPaidAmt = selectedPayInvoice?.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
              const remainingAmt = Math.max(0, totalAmt - totalPaidAmt);

              return (
                <>
                  <div className="rounded-lg bg-secondary/30 border border-border/50 p-4 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tổng tiền hóa đơn:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(totalAmt)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Đã thanh toán trước đó:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaidAmt)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-border/50 pt-2 text-primary">
                      <span>Số tiền còn lại:</span>
                      <span>{formatCurrency(remainingAmt)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pay-amount-input">Số tiền thanh toán lần này (VND)</Label>
                    <Input
                      id="pay-amount-input"
                      type="number"
                      placeholder="Nhập số tiền cần thanh toán"
                      value={payAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPayAmount(val);
                      }}
                      min={1000}
                      max={remainingAmt}
                      className="w-full text-lg font-semibold text-primary"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Mặc định điền toàn bộ số tiền còn thiếu. Có thể điều chỉnh nếu muốn thanh toán một phần.
                    </p>
                  </div>
                </>
              );
            })()}

            <div className="space-y-2">
              <Label htmlFor="pay-method-select">Phương thức thanh toán</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger id="pay-method-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Tiền mặt</SelectItem>
                  <SelectItem value="TRANSFER">Chuyển khoản</SelectItem>
                  <SelectItem value="CARD">Thẻ ngân hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pay-note-input">Ghi chú thanh toán</Label>
              <Input
                id="pay-note-input"
                placeholder="Ví dụ: Khách thanh toán tại quầy"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenPayDialog(false)}>
                Hủy
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={paying}>
                {paying && <Loader2 className="mr-2 size-4 animate-spin" />}
                Xác nhận thanh toán
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW INVOICE DETAIL & PRINT MODAL */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="print:hidden">
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
          </DialogHeader>

          {activeInvoice && (
            <div className="space-y-6">
              {/* Receipt Preview (Not used directly for printing, just for screen viewing) */}
              {renderInvoiceTemplate(activeInvoice, false)}

              {/* Action Buttons inside Dialog (hidden when printing) */}
              <DialogFooter className="print:hidden">
                <Button variant="outline" onClick={() => setOpenViewDialog(false)}>
                  Đóng
                </Button>
                {(activeInvoice.status === "UNPAID" || activeInvoice.status === "PARTIALLY_PAID") && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setOpenViewDialog(false);
                      handleOpenPayDialog(activeInvoice);
                    }}
                  >
                    Thanh toán hóa đơn
                  </Button>
                )}
                <Button onClick={() => handlePrint(activeInvoice)}>
                  <Printer className="mr-2 size-4" />
                  In hóa đơn
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Root level print area (always in DOM, only visible during print) */}
      {renderInvoiceTemplate(activeInvoice, true)}
    </div>
  );
}