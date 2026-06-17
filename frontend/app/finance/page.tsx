"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FinanceAPI } from "@/services/finance.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  Filter,
  Calendar,
  X,
  Trash2,
  Loader2,
} from "lucide-react";

// Categories mapping
const INCOME_CATEGORIES = ["Tiền phòng", "Dịch vụ", "Bán hàng", "Khác"];
const EXPENSE_CATEGORIES = ["Bảo trì", "Vật tư", "Lương nhân viên", "Điện nước", "Khác"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getTypeLabel(type: string) {
  if (type === "INCOME") return "Thu";
  if (type === "EXPENSE") return "Chi";
  return type;
}

function getTypeClass(type: string) {
  if (type === "INCOME") return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300";
  if (type === "EXPENSE") return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300";
  return "bg-muted text-muted-foreground";
}

function getTypeIcon(type: string) {
  if (type === "INCOME") return ArrowDownCircle;
  return ArrowUpCircle;
}

export default function FinancePage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN";

  // Data State
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Form State
  const [formType, setFormType] = useState<string>("INCOME");
  const [formCategory, setFormCategory] = useState<string>("Tiền phòng");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState<string>("");

  // Automatically update category dropdown options based on selected Type
  useEffect(() => {
    if (formType === "INCOME") {
      setFormCategory(INCOME_CATEGORIES[0]);
    } else {
      setFormCategory(EXPENSE_CATEGORIES[0]);
    }
  }, [formType]);

  // Fetch Data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const queryType = filterType === "ALL" ? undefined : filterType;
      const queryCategory = filterCategory === "ALL" ? undefined : filterCategory;

      // Call API
      const txData = await FinanceAPI.getTransactions({
        type: queryType,
        category: queryCategory,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchQuery || undefined,
      });

      const statsData = await FinanceAPI.getStats({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setTransactions(txData);
      setStats(statsData);
    } catch (error: any) {
      console.error("Lỗi khi tải dữ liệu tài chính:", error);
      toast.error(error.message || "Không thể tải dữ liệu tài chính");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCategory, startDate, endDate, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Add Transaction Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      return toast.error("Vui lòng nhập số tiền hợp lệ và lớn hơn 0");
    }

    try {
      setSubmitting(true);
      const newTx = await FinanceAPI.createTransaction({
        type: formType,
        category: formCategory,
        amount: Number(formAmount),
        date: formDate,
        description: formDescription,
      });

      if (newTx) {
        toast.success("Thêm giao dịch thu chi thành công!");
        setShowAddModal(false);
        // Reset form
        setFormAmount("");
        setFormDescription("");
        setFormDate(new Date().toISOString().split("T")[0]);
        // Refresh data
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi lưu giao dịch");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Transaction (Admin Only)
  const handleDeleteTx = async (id: string, code: string) => {
    if (!isAdmin) return;
    if (confirm(`Bạn có chắc chắn muốn xóa giao dịch "${code}" không? Hành động này sẽ cập nhật lại dòng tiền hệ thống.`)) {
      try {
        await FinanceAPI.deleteTransaction(id);
        toast.success("Xóa giao dịch thành công!");
        fetchData();
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi xóa giao dịch");
      }
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilterType("ALL");
    setFilterCategory("ALL");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Thu chi"
          subtitle="Quản lý các khoản thu, khoản chi và lợi nhuận khách sạn"
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">Quản lý thu chi</h2>
              <p className="text-sm text-muted-foreground">
                Theo dõi doanh thu, chi phí thực tế và kiểm soát dòng tiền vận hành
              </p>
            </div>

            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 size-4" />
              Thêm giao dịch mới
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
                  <TrendingUp className="size-6 text-green-700 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng thu</p>
                  <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(stats.totalIncome)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
                  <TrendingDown className="size-6 text-red-700 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng chi</p>
                  <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {formatCurrency(stats.totalExpense)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-sm sm:col-span-2 lg:col-span-1">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                  <Wallet className="size-6 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lợi nhuận ròng</p>
                  <h3 className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-amber-600 dark:text-amber-500'}`}>
                    {formatCurrency(stats.profit)}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Area */}
          <Card className="mb-6 shadow-sm">
            <CardHeader className="py-4 border-b">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Bộ lọc tìm kiếm</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Search */}
                <div className="space-y-1.5">
                  <Label htmlFor="search" className="text-xs font-medium">Tìm kiếm</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Mã GD, nội dung..."
                      className="pl-8 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filter Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phân loại</Label>
                  <Select value={filterType} onValueChange={(val) => setFilterType(val)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả giao dịch</SelectItem>
                      <SelectItem value="INCOME">Khoản thu (+)</SelectItem>
                      <SelectItem value="EXPENSE">Khoản chi (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Category */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Danh mục</Label>
                  <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                      <SelectItem value="Tiền phòng">Tiền phòng</SelectItem>
                      <SelectItem value="Dịch vụ">Dịch vụ</SelectItem>
                      <SelectItem value="Bán hàng">Bán hàng</SelectItem>
                      <SelectItem value="Bảo trì">Bảo trì</SelectItem>
                      <SelectItem value="Vật tư">Vật tư</SelectItem>
                      <SelectItem value="Lương nhân viên">Lương nhân viên</SelectItem>
                      <SelectItem value="Điện nước">Điện nước</SelectItem>
                      <SelectItem value="Khác">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date range filters */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Từ ngày</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-8 h-9 text-xs"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Đến ngày</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-8 h-9 text-xs"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Reset button */}
              {(filterType !== "ALL" || filterCategory !== "ALL" || startDate || endDate || searchQuery) && (
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs h-8">
                    <X className="mr-1 size-3.5" />
                    Xóa bộ lọc
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions Table Card */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="size-5 text-primary" />
                Sổ nhật ký giao dịch thu chi
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex h-60 flex-col items-center justify-center gap-2 bg-background">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Đang tải sổ quỹ...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-4 text-left font-semibold">Mã GD</th>
                        <th className="p-4 text-left font-semibold">Phân loại</th>
                        <th className="p-4 text-left font-semibold">Danh mục</th>
                        <th className="p-4 text-left font-semibold">Nội dung / Mô tả</th>
                        <th className="p-4 text-left font-semibold">Số tiền</th>
                        <th className="p-4 text-left font-semibold">Ngày giao dịch</th>
                        <th className="p-4 text-left font-semibold">Người tạo</th>
                        <th className="p-4 text-right font-semibold">Thao tác</th>
                      </tr>
                    </thead>

                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-muted-foreground">
                            Không tìm thấy giao dịch tài chính nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        transactions.map((item) => {
                          const TypeIcon = getTypeIcon(item.type);
                          const dateObj = new Date(item.date);
                          const formattedDate = dateObj.toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          });

                          return (
                            <tr key={item.id} className="border-b hover:bg-muted/40 transition-colors">
                              <td className="p-4 font-mono font-bold text-xs text-muted-foreground">{item.code}</td>

                              <td className="p-4">
                                <Badge className={`${getTypeClass(item.type)} border-0 font-medium px-2 py-0.5`}>
                                  <TypeIcon className="mr-1 size-3" />
                                  {getTypeLabel(item.type)}
                                </Badge>
                              </td>

                              <td className="p-4">
                                <span className="font-semibold text-foreground">{item.category}</span>
                              </td>

                              <td className="p-4 max-w-[200px] truncate" title={item.description}>
                                {item.description || <em className="text-muted-foreground text-xs">Không có mô tả</em>}
                              </td>

                              <td className="p-4">
                                <span className={`font-bold ${item.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                                </span>
                              </td>

                              <td className="p-4 font-medium">{formattedDate}</td>

                              <td className="p-4">
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {item.createdBy?.fullName || "Hệ thống"}
                                </span>
                              </td>

                              <td className="p-4">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 px-2"
                                    onClick={() => {
                                      setSelectedTx(item);
                                      setShowDetailModal(true);
                                    }}
                                  >
                                    <Eye className="mr-1 size-3.5" />
                                    Xem
                                  </Button>
                                  
                                  {isAdmin && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => handleDeleteTx(item.id, item.code)}
                                    >
                                      <Trash2 className="mr-1 size-3.5" />
                                      Xóa
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* MODAL 1: THÊM GIAO DỊCH MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>

            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl">Thêm giao dịch thu chi mới</CardTitle>
              <CardDescription>Ghi nhận khoản thu hoặc chi thực tế phát sinh vào sổ quỹ khách sạn.</CardDescription>
            </CardHeader>

            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              {/* Type Input */}
              <div className="grid gap-2">
                <Label className="font-semibold">Loại giao dịch</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formType === "INCOME" ? "default" : "outline"}
                    className={formType === "INCOME" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setFormType("INCOME")}
                  >
                    <ArrowDownCircle className="mr-2 size-4" /> Thu (Income)
                  </Button>
                  <Button
                    type="button"
                    variant={formType === "EXPENSE" ? "default" : "outline"}
                    className={formType === "EXPENSE" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => setFormType("EXPENSE")}
                  >
                    <ArrowUpCircle className="mr-2 size-4" /> Chi (Expense)
                  </Button>
                </div>
              </div>

              {/* Category Input */}
              <div className="grid gap-2">
                <Label htmlFor="category" className="font-semibold">Danh mục</Label>
                <Select value={formCategory} onValueChange={(val) => setFormCategory(val)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formType === "INCOME" 
                      ? INCOME_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)
                      : EXPENSE_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount Input */}
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="font-semibold">Số tiền *</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      required
                      placeholder="VD: 500000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">đ</span>
                  </div>
                </div>

                {/* Date Input */}
                <div className="grid gap-2">
                  <Label htmlFor="date" className="font-semibold">Ngày thực hiện *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Description Input */}
              <div className="grid gap-2">
                <Label htmlFor="description" className="font-semibold">Mô tả / Nội dung giao dịch</Label>
                <Textarea
                  id="description"
                  placeholder="Nhập lý do chi, thông tin biên lai, tên khách hàng thu phí..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Hủy bỏ</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/95" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Lưu giao dịch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM CHI TIẾT GIAO DỊCH */}
      {showDetailModal && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-lg animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowDetailModal(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
            </button>

            <CardHeader className="px-0 pt-0 border-b pb-4">
              <div className="flex items-center gap-2">
                <Badge className={getTypeClass(selectedTx.type)}>
                  {getTypeLabel(selectedTx.type)}
                </Badge>
                <CardTitle className="text-base font-mono">{selectedTx.code}</CardTitle>
              </div>
              <CardDescription className="pt-1">Chi tiết giao dịch ghi nhận hệ thống</CardDescription>
            </CardHeader>

            <div className="space-y-4 py-4 text-sm">
              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground font-medium">Danh mục:</span>
                <span className="col-span-2 font-semibold text-foreground">{selectedTx.category}</span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground font-medium">Số tiền:</span>
                <span className={`col-span-2 font-bold text-base ${selectedTx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedTx.type === 'INCOME' ? '+' : '-'}{formatCurrency(selectedTx.amount)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground font-medium">Ngày thực hiện:</span>
                <span className="col-span-2 font-medium">
                  {new Date(selectedTx.date).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1">
                <span className="text-muted-foreground font-medium">Người lập phiếu:</span>
                <span className="col-span-2 font-medium text-foreground">
                  {selectedTx.createdBy?.fullName || "Hệ thống"} ({selectedTx.createdBy?.role === 'ADMIN' ? 'Quản trị viên' : 'Quản lý'})
                </span>
              </div>

              <div className="border-t pt-3 space-y-1">
                <span className="text-muted-foreground font-medium block">Nội dung chi tiết:</span>
                <p className="bg-muted p-3 rounded-lg text-xs leading-relaxed text-foreground min-h-[60px] whitespace-pre-line">
                  {selectedTx.description || "Không có nội dung mô tả đính kèm."}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={() => setShowDetailModal(false)}>Đóng</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}