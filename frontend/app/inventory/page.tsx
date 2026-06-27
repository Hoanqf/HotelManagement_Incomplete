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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryAPI } from "@/services/inventory.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  Boxes,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Filter,
  AlertTriangle,
  ClipboardList,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  User,
  Tags,
  CircleDollarSign,
  Loader2,
  FileSpreadsheet
} from "lucide-react";

// Định dạng danh mục
const INVENTORY_CATEGORIES = [
  "Tiện ích phòng",
  "Đồ uống & Đồ ăn nhẹ",
  "Đồ giặt là & Vải",
  "Dụng cụ dọn dẹp",
  "Khác"
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default function InventoryPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPERADMIN";

  // State Tabs
  const [activeTab, setActiveTab] = useState<string>("stock");

  // State Dữ liệu
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Thẻ thống kê
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    totalValue: 0
  });

  // State tìm kiếm & lọc
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [txTypeFilter, setTxTypeFilter] = useState<string>("ALL");
  const [txItemFilter, setTxItemFilter] = useState<string>("ALL");

  // State Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  
  // State Form
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Form tạo/sửa vật tư
  const [formName, setFormName] = useState<string>("");
  const [formSku, setFormSku] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("Tiện ích phòng");
  const [formUnit, setFormUnit] = useState<string>("Cái");
  const [formMinQuantity, setFormMinQuantity] = useState<string>("10");
  const [formCostPrice, setFormCostPrice] = useState<string>("0");
  const [formSellingPrice, setFormSellingPrice] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");

  // Form nhập kho
  const [importItemId, setImportItemId] = useState<string>("");
  const [importQuantity, setImportQuantity] = useState<string>("");
  const [importPrice, setImportPrice] = useState<string>("");
  const [importReason, setImportReason] = useState<string>("Nhập hàng định kỳ");
  const [importReferenceId, setImportReferenceId] = useState<string>("");

  // Form xuất kho
  const [exportItemId, setExportItemId] = useState<string>("");
  const [exportQuantity, setExportQuantity] = useState<string>("");
  const [exportReason, setExportReason] = useState<string>("Cung cấp buồng phòng");
  const [exportReferenceId, setExportReferenceId] = useState<string>("");

  // Tải danh sách vật tư và tính toán thống kê
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await InventoryAPI.getItems();
      setItems(data);

      // Tính toán thống kê
      let lowStock = 0;
      let val = 0;
      data.forEach((item: any) => {
        if (item.quantity <= item.minQuantity) {
          lowStock++;
        }
        val += item.quantity * item.costPrice;
      });

      setStats({
        totalItems: data.length,
        lowStockCount: lowStock,
        totalValue: val
      });
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tải danh sách vật tư kho");
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải lịch sử giao dịch kho
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (txTypeFilter !== "ALL") filters.type = txTypeFilter;
      if (txItemFilter !== "ALL") filters.itemId = txItemFilter;

      const data = await InventoryAPI.getTransactions(filters);
      setTransactions(data);
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tải lịch sử giao dịch");
    } finally {
      setLoading(false);
    }
  }, [txTypeFilter, txItemFilter]);

  // Khởi động tải dữ liệu
  useEffect(() => {
    if (activeTab === "stock") {
      fetchItems();
    } else {
      fetchItems(); // Tải items để làm dropdown chọn trong form giao dịch
      fetchTransactions();
    }
  }, [activeTab, fetchItems, fetchTransactions]);

  // Xử lý tạo/sửa vật tư Submit
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCategory || !formUnit) {
      return toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formName,
        sku: formSku || undefined,
        category: formCategory,
        unit: formUnit,
        minQuantity: Number(formMinQuantity) || 0,
        costPrice: Number(formCostPrice) || 0,
        sellingPrice: formSellingPrice ? Number(formSellingPrice) : undefined,
        description: formDescription || undefined
      };

      if (showEditModal && selectedItem) {
        await InventoryAPI.updateItem(selectedItem.id, payload);
        toast.success("Cập nhật vật tư thành công!");
        setShowEditModal(false);
      } else {
        await InventoryAPI.createItem(payload);
        toast.success("Thêm mới vật tư thành công!");
        setShowAddModal(false);
      }
      
      // Reset form
      resetItemForm();
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi lưu thông tin vật tư");
    } finally {
      setSubmitting(false);
    }
  };

  // Mở form chỉnh sửa vật tư
  const handleEditClick = (item: any) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormSku(item.sku || "");
    setFormCategory(item.category);
    setFormUnit(item.unit);
    setFormMinQuantity(item.minQuantity.toString());
    setFormCostPrice(item.costPrice.toString());
    setFormSellingPrice(item.sellingPrice ? item.sellingPrice.toString() : "");
    setFormDescription(item.description || "");
    setShowEditModal(true);
  };

  // Xóa vật tư (Chỉ Admin)
  const handleDeleteItem = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`Bạn có chắc chắn muốn xóa vật tư "${name}" không? Hành động này không thể hoàn tác.`)) {
      try {
        await InventoryAPI.deleteItem(id);
        toast.success("Xóa vật tư thành công!");
        fetchItems();
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi xóa vật tư");
      }
    }
  };

  // Reset form vật tư
  const resetItemForm = () => {
    setFormName("");
    setFormSku("");
    setFormCategory("Tiện ích phòng");
    setFormUnit("Cái");
    setFormMinQuantity("10");
    setFormCostPrice("0");
    setFormSellingPrice("");
    setFormDescription("");
    setSelectedItem(null);
  };

  // Xử lý tạo phiếu Nhập kho Submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importItemId || !importQuantity || !importPrice) {
      return toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc (*)");
    }
    if (Number(importQuantity) <= 0) {
      return toast.error("Số lượng nhập phải lớn hơn 0");
    }

    try {
      setSubmitting(true);
      await InventoryAPI.importStock({
        itemId: importItemId,
        quantity: Number(importQuantity),
        price: Number(importPrice),
        reason: importReason,
        referenceId: importReferenceId || undefined
      });

      toast.success("Lập phiếu nhập kho thành công và đã đồng bộ chi phí thu chi!");
      setShowImportModal(false);
      
      // Reset form
      setImportItemId("");
      setImportQuantity("");
      setImportPrice("");
      setImportReason("Nhập hàng định kỳ");
      setImportReferenceId("");
      
      // Refresh dữ liệu
      fetchItems();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi làm lệnh nhập kho");
    } finally {
      setSubmitting(false);
    }
  };

  // Tự động điền giá vốn khi chọn hàng để nhập kho
  useEffect(() => {
    if (importItemId) {
      const selected = items.find(item => item.id === importItemId);
      if (selected) {
        setImportPrice(selected.costPrice.toString());
      }
    }
  }, [importItemId, items]);

  // Xử lý tạo phiếu Xuất kho Submit
  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportItemId || !exportQuantity) {
      return toast.error("Vui lòng chọn vật tư và số lượng xuất (*)");
    }
    if (Number(exportQuantity) <= 0) {
      return toast.error("Số lượng xuất phải lớn hơn 0");
    }

    // Kiểm tra lượng tồn kho hiện tại trước khi xuất
    const selected = items.find(item => item.id === exportItemId);
    if (selected && selected.quantity < Number(exportQuantity)) {
      return toast.error(`Không đủ tồn kho. Phòng kho hiện chỉ còn ${selected.quantity} ${selected.unit}.`);
    }

    try {
      setSubmitting(true);
      await InventoryAPI.exportStock({
        itemId: exportItemId,
        quantity: Number(exportQuantity),
        reason: exportReason,
        referenceId: exportReferenceId || undefined
      });

      toast.success("Lập phiếu xuất kho thành công!");
      setShowExportModal(false);

      // Reset form
      setExportItemId("");
      setExportQuantity("");
      setExportReason("Cung cấp buồng phòng");
      setExportReferenceId("");

      // Refresh dữ liệu
      fetchItems();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi làm lệnh xuất kho");
    } finally {
      setSubmitting(false);
    }
  };

  // Bộ lọc danh sách tồn kho hiển thị
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Quản lý kho vật tư"
          subtitle="Theo dõi xuất nhập tồn đồ amenities, minibar và đồ dùng khách sạn"
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Thẻ Thống kê Tổng quan */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden border-sidebar-border bg-card shadow-sm transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số mặt hàng</CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Boxes className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground mt-1">Các mặt hàng đang theo dõi</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-sidebar-border bg-card shadow-sm transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cảnh báo hết / sắp hết hàng</CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <AlertTriangle className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-500">
                  {stats.lowStockCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Số vật tư cần nhập thêm hoặc sắp hết</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-sidebar-border bg-card shadow-sm transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng giá trị tồn kho</CardTitle>
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CircleDollarSign className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-500">
                  {formatCurrency(stats.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tạm tính theo giá vốn sản phẩm</p>
              </CardContent>
            </Card>
          </div>

          {/* Nội dung Tabs chức năng */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-2">
              <TabsList className="bg-muted/80 p-0.5">
                <TabsTrigger value="stock" className="flex items-center gap-2">
                  <ClipboardList className="size-4" />
                  Tổng hợp tồn kho
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <FileSpreadsheet className="size-4" />
                  Lịch sử xuất nhập
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setShowImportModal(true)} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2"
                >
                  <ArrowDownToLine className="size-4" />
                  Nhập kho
                </Button>
                <Button 
                  onClick={() => setShowExportModal(true)} 
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2"
                >
                  <ArrowUpFromLine className="size-4" />
                  Xuất kho
                </Button>
              </div>
            </div>

            {/* TAB 1: TỔNG HỢP TỒN KHO */}
            <TabsContent value="stock" className="space-y-4 outline-none">
              
              {/* Thanh Tìm kiếm và Lọc */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between bg-card p-4 rounded-xl border border-sidebar-border shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm vật tư theo tên hoặc SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-muted/30 focus-visible:bg-background"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px] bg-muted/20">
                      <SelectValue placeholder="Tất cả danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả danh mục</SelectItem>
                      {INVENTORY_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={() => setShowAddModal(true)} 
                    className="bg-primary hover:bg-primary/90 font-semibold"
                  >
                    <Plus className="size-4 mr-1.5" /> Thêm vật tư mới
                  </Button>
                </div>
              </div>

              {/* Bảng tồn kho */}
              <div className="rounded-xl border border-sidebar-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm text-left">
                    <thead className="bg-muted/50 border-b border-sidebar-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-4">SKU</th>
                        <th className="p-4">Tên vật tư</th>
                        <th className="p-4">Danh mục</th>
                        <th className="p-4 text-center">Đơn vị</th>
                        <th className="p-4 text-right">Tồn thực tế</th>
                        <th className="p-4 text-right">Định mức tối thiểu</th>
                        <th className="p-4 text-right">Đơn giá vốn</th>
                        <th className="p-4 text-right">Giá bán đề xuất</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border">
                      {loading ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-muted-foreground">
                            <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                            Đang tải danh sách tồn kho...
                          </td>
                        </tr>
                      ) : filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-muted-foreground">
                            Không tìm thấy vật tư nào trong kho.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map(item => {
                          const isOutOfStock = item.quantity === 0;
                          const isLowStock = item.quantity > 0 && item.quantity <= item.minQuantity;
                          return (
                            <tr 
                              key={item.id} 
                              className={`hover:bg-muted/30 transition-colors ${
                                isOutOfStock ? "bg-red-50/10 dark:bg-red-950/5" :
                                isLowStock ? "bg-amber-50/10 dark:bg-amber-950/5" : ""
                              }`}
                            >
                              <td className="p-4 font-mono font-semibold text-muted-foreground">
                                {item.sku || "—"}
                              </td>
                              <td className="p-4 font-semibold text-foreground">
                                {item.name}
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {item.category}
                              </td>
                              <td className="p-4 text-center text-muted-foreground">
                                {item.unit}
                              </td>
                              <td className="p-4 text-right font-bold text-foreground">
                                {item.quantity}
                              </td>
                              <td className="p-4 text-right text-muted-foreground">
                                {item.minQuantity}
                              </td>
                              <td className="p-4 text-right text-muted-foreground">
                                {formatCurrency(item.costPrice)}
                              </td>
                              <td className="p-4 text-right text-muted-foreground">
                                {item.sellingPrice ? formatCurrency(item.sellingPrice) : "—"}
                              </td>
                              <td className="p-4 text-center">
                                {isOutOfStock ? (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-200 shadow-none dark:bg-red-950 dark:text-red-300">
                                    Đã hết hàng
                                  </Badge>
                                ) : isLowStock ? (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border border-amber-200 shadow-none dark:bg-amber-950 dark:text-amber-300">
                                    Sắp hết hàng
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 shadow-none dark:bg-emerald-950 dark:text-emerald-300">
                                    Đủ hàng
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditClick(item)}
                                    className="size-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                  >
                                    <Edit2 className="size-4" />
                                  </Button>
                                  {isAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteItem(item.id, item.name)}
                                      className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                                    >
                                      <Trash2 className="size-4" />
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
              </div>
            </TabsContent>

            {/* TAB 2: LỊCH SỬ XUẤT NHẬP KHO */}
            <TabsContent value="history" className="space-y-4 outline-none">
              
              {/* Lọc lịch sử */}
              <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border border-sidebar-border shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">Hành động:</span>
                  <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                    <SelectTrigger className="w-[150px] bg-muted/20">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả hành động</SelectItem>
                      <SelectItem value="IMPORT">Nhập kho (IMPORT)</SelectItem>
                      <SelectItem value="EXPORT">Xuất kho (EXPORT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">Mặt hàng:</span>
                  <Select value={txItemFilter} onValueChange={setTxItemFilter}>
                    <SelectTrigger className="w-[200px] bg-muted/20">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả mặt hàng</SelectItem>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={fetchTransactions} 
                  variant="outline" 
                  className="font-medium ml-auto flex items-center gap-1.5"
                >
                  <Calendar className="size-4" /> Lọc báo cáo
                </Button>
              </div>

              {/* Bảng giao dịch */}
              <div className="rounded-xl border border-sidebar-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm text-left">
                    <thead className="bg-muted/50 border-b border-sidebar-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-4">Thời gian</th>
                        <th className="p-4 text-center">Hành động</th>
                        <th className="p-4">Sản phẩm</th>
                        <th className="p-4 text-right">Số lượng</th>
                        <th className="p-4 text-right">Đơn giá</th>
                        <th className="p-4 text-right">Thành tiền</th>
                        <th className="p-4">Lý do phát sinh</th>
                        <th className="p-4">Mã tham chiếu / Đối chiếu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            <Loader2 className="size-6 animate-spin mx-auto mb-2 text-primary" />
                            Đang tải lịch sử kho...
                          </td>
                        </tr>
                      ) : transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            Chưa có dữ liệu nhập xuất kho nào khớp bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        transactions.map(tx => {
                          const isImport = tx.type === "IMPORT";
                          return (
                            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4 text-muted-foreground">
                                {formatDate(tx.date)}
                              </td>
                              <td className="p-4 text-center">
                                {isImport ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border border-green-200 dark:bg-green-950 dark:text-green-300">
                                    NHẬP KHO
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-200 dark:bg-red-950 dark:text-red-300">
                                    XUẤT KHO
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4 font-semibold text-foreground">
                                {tx.item?.name || "Vật tư đã bị xóa"}
                                {tx.item?.sku && <span className="text-xs text-muted-foreground font-mono block">SKU: {tx.item.sku}</span>}
                              </td>
                              <td className="p-4 text-right font-bold text-foreground">
                                {tx.quantity} {tx.item?.unit || ""}
                              </td>
                              <td className="p-4 text-right text-muted-foreground">
                                {formatCurrency(tx.price)}
                              </td>
                              <td className="p-4 text-right font-bold text-foreground">
                                {formatCurrency(tx.totalAmount)}
                              </td>
                              <td className="p-4 text-muted-foreground">
                                {tx.reason}
                              </td>
                              <td className="p-4 font-mono text-muted-foreground">
                                {tx.referenceId || "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* DIALOG THÊM MẶT HÀNG MỚI */}
          <Dialog open={showAddModal} onOpenChange={(open) => {
            if (!open) setShowAddModal(false);
            resetItemForm();
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleItemSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Plus className="size-5 text-primary" /> Thêm vật tư mới vào kho
                  </DialogTitle>
                  <DialogDescription>
                    Khai báo sản phẩm mới để tiến hành quản lý nhập xuất tồn kho.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="item-name" className="font-semibold">Tên vật tư <span className="text-red-500">*</span></Label>
                      <Input
                        id="item-name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ví dụ: Nước khoáng Aquafina"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="item-sku" className="font-semibold">Mã SKU / Định danh</Label>
                      <Input
                        id="item-sku"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        placeholder="Ví dụ: AQUA-500ML"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold">Danh mục <span className="text-red-500">*</span></Label>
                      <Select value={formCategory} onValueChange={setFormCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVENTORY_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="item-unit" className="font-semibold">Đơn vị tính <span className="text-red-500">*</span></Label>
                      <Input
                        id="item-unit"
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        placeholder="Lon, Chai, Cái, Kg..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="item-min" className="font-semibold">Định mức tối thiểu</Label>
                      <Input
                        id="item-min"
                        type="number"
                        min="0"
                        value={formMinQuantity}
                        onChange={(e) => setFormMinQuantity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="item-cost" className="font-semibold">Đơn giá vốn (nhập)</Label>
                      <Input
                        id="item-cost"
                        type="number"
                        min="0"
                        value={formCostPrice}
                        onChange={(e) => setFormCostPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="item-sell" className="font-semibold">Giá bán (nếu có)</Label>
                      <Input
                        id="item-sell"
                        type="number"
                        min="0"
                        value={formSellingPrice}
                        onChange={(e) => setFormSellingPrice(e.target.value)}
                        placeholder="Trống"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="item-desc" className="font-semibold">Mô tả thêm</Label>
                    <Textarea
                      id="item-desc"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Mô tả công dụng, vị trí lưu kho..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary text-white font-semibold"
                  >
                    {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Xác nhận thêm
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* DIALOG CHỈNH SỬA MẶT HÀNG */}
          <Dialog open={showEditModal} onOpenChange={(open) => {
            if (!open) setShowEditModal(false);
            resetItemForm();
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleItemSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 text-blue-600">
                    <Edit2 className="size-5" /> Chỉnh sửa vật tư kho
                  </DialogTitle>
                  <DialogDescription>
                    Thay đổi thông tin, định lượng và giá vốn của sản phẩm trong kho.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-name" className="font-semibold">Tên vật tư <span className="text-red-500">*</span></Label>
                      <Input
                        id="edit-name"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-sku" className="font-semibold">Mã SKU / Định danh</Label>
                      <Input
                        id="edit-sku"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="font-semibold">Danh mục <span className="text-red-500">*</span></Label>
                      <Select value={formCategory} onValueChange={setFormCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INVENTORY_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-unit" className="font-semibold">Đơn vị tính <span className="text-red-500">*</span></Label>
                      <Input
                        id="edit-unit"
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-min" className="font-semibold">Định mức tối thiểu</Label>
                      <Input
                        id="edit-min"
                        type="number"
                        min="0"
                        value={formMinQuantity}
                        onChange={(e) => setFormMinQuantity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-cost" className="font-semibold">Đơn giá vốn (nhập)</Label>
                      <Input
                        id="edit-cost"
                        type="number"
                        min="0"
                        value={formCostPrice}
                        onChange={(e) => setFormCostPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-sell" className="font-semibold">Giá bán đề xuất</Label>
                      <Input
                        id="edit-sell"
                        type="number"
                        min="0"
                        value={formSellingPrice}
                        onChange={(e) => setFormSellingPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-desc" className="font-semibold">Mô tả thêm</Label>
                    <Textarea
                      id="edit-desc"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Lưu thay đổi
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* DIALOG LẬP PHIẾU NHẬP KHO */}
          <Dialog open={showImportModal} onOpenChange={(open) => {
            if (!open) {
              setShowImportModal(false);
              setImportItemId("");
              setImportQuantity("");
              setImportPrice("");
              setImportReason("Nhập hàng định kỳ");
              setImportReferenceId("");
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleImportSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-600">
                    <ArrowDownToLine className="size-5" /> Lập phiếu nhập kho vật tư
                  </DialogTitle>
                  <DialogDescription>
                    Tăng số lượng sản phẩm kho. Hệ thống sẽ tự tạo phiếu Chi phí tương ứng bên kế toán tài chính.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 text-sm">
                  <div className="space-y-1">
                    <Label className="font-semibold">Chọn vật tư nhập kho <span className="text-red-500">*</span></Label>
                    <Select value={importItemId} onValueChange={setImportItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bấm chọn sản phẩm..." />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} (Tồn hiện tại: {item.quantity} {item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="import-qty" className="font-semibold">Số lượng nhập <span className="text-red-500">*</span></Label>
                      <Input
                        id="import-qty"
                        type="number"
                        min="1"
                        placeholder="Số lượng thực nhập"
                        value={importQuantity}
                        onChange={(e) => setImportQuantity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="import-price" className="font-semibold">Đơn giá nhập hàng <span className="text-red-500">*</span></Label>
                      <Input
                        id="import-price"
                        type="number"
                        min="0"
                        placeholder="Đơn giá / sản phẩm"
                        value={importPrice}
                        onChange={(e) => setImportPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Lý do nhập kho <span className="text-red-500">*</span></Label>
                    <Select value={importReason} onValueChange={setImportReason}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nhập hàng định kỳ">Nhập hàng định kỳ / Đặt hàng nhà cung cấp</SelectItem>
                        <SelectItem value="Bổ sung kho khẩn cấp">Bổ sung kho khẩn cấp</SelectItem>
                        <SelectItem value="Hàng trả lại từ khách / buồng">Khách trả lại / Hoàn trả minibar</SelectItem>
                        <SelectItem value="Lý do khác">Lý do phát sinh khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="import-ref" className="font-semibold">Mã số hóa đơn mua / Nhà cung cấp</Label>
                    <Input
                      id="import-ref"
                      placeholder="Mã đối chiếu hoặc tên NCC (Không bắt buộc)"
                      value={importReferenceId}
                      onChange={(e) => setImportReferenceId(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowImportModal(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Xác nhận nhập kho
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* DIALOG LẬP PHIẾU XUẤT KHO */}
          <Dialog open={showExportModal} onOpenChange={(open) => {
            if (!open) {
              setShowExportModal(false);
              setExportItemId("");
              setExportQuantity("");
              setExportReason("Cung cấp buồng phòng");
              setExportReferenceId("");
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleExportSubmit}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
                    <ArrowUpFromLine className="size-5" /> Lập phiếu xuất kho vật tư
                  </DialogTitle>
                  <DialogDescription>
                    Giảm số lượng sản phẩm trong kho phục vụ dọn dẹp buồng phòng hoặc bán lẻ.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 text-sm">
                  <div className="space-y-1">
                    <Label className="font-semibold">Chọn vật tư xuất kho <span className="text-red-500">*</span></Label>
                    <Select value={exportItemId} onValueChange={setExportItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Bấm chọn sản phẩm..." />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map(item => (
                          <SelectItem key={item.id} value={item.id} disabled={item.quantity <= 0}>
                            {item.name} (Tồn kho hiện tại: {item.quantity} {item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="export-qty" className="font-semibold">Số lượng xuất kho <span className="text-red-500">*</span></Label>
                    <Input
                      id="export-qty"
                      type="number"
                      min="1"
                      placeholder="Số lượng thực xuất"
                      value={exportQuantity}
                      onChange={(e) => setExportQuantity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="font-semibold">Lý do xuất kho <span className="text-red-500">*</span></Label>
                    <Select value={exportReason} onValueChange={setExportReason}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cung cấp buồng phòng">Cung cấp buồng phòng định kỳ (Amenities)</SelectItem>
                        <SelectItem value="Bổ sung minibar phòng">Bổ sung tủ lạnh minibar phòng khách ở</SelectItem>
                        <SelectItem value="Xuất hủy hao hụt">Xuất hủy do hao hụt / Hỏng hóc / Hết hạn</SelectItem>
                        <SelectItem value="Bán lẻ cho khách tại sảnh">Bán lẻ trực tiếp tại quầy</SelectItem>
                        <SelectItem value="Lý do khác">Lý do phát sinh khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="export-ref" className="font-semibold">Số phòng hoặc Mã đặt phòng liên quan</Label>
                    <Input
                      id="export-ref"
                      placeholder="Ví dụ: Phòng 102 hoặc mã BK-1021 (Không bắt buộc)"
                      value={exportReferenceId}
                      onChange={(e) => setExportReferenceId(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowExportModal(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Xác nhận xuất kho
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  );
}
