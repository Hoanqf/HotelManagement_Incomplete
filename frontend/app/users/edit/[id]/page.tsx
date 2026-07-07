"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAPI } from "@/services/user.service";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  Save, 
  UserCircle, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Upload,
  Loader2,
  X,
  Edit3,
  Info,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  { key: "DASHBOARD", name: "Tổng quan (Dashboard)", desc: "Xem biểu đồ doanh thu, số liệu tổng hợp hệ thống" },
  { key: "ROOMS", name: "Quản lý phòng (Rooms)", desc: "Xem trạng thái, sơ đồ phòng, dọn dẹp" },
  { key: "BOOKINGS", name: "Đặt phòng (Bookings)", desc: "Đặt phòng mới, nhận/trả phòng (Check-in/Check-out)" },
  { key: "CUSTOMERS", name: "Quản lý khách hàng (Customers)", desc: "Xem danh sách khách hàng, lịch sử đặt và chi tiêu" },
  { key: "SERVICES", name: "Dịch vụ phòng (Services)", desc: "Gọi món, dịch vụ giặt là, spa cho khách hàng" },
  { key: "INVOICES", name: "Hóa đơn & In ấn (Invoices)", desc: "Xuất hóa đơn, thanh toán, in hóa đơn thanh toán" },
  { key: "INVENTORY", name: "Quản lý kho (Inventory)", desc: "Nhập xuất hàng hóa tiêu dùng, đồ uống, trang thiết bị" },
  { key: "FINANCE", name: "Thu chi (Finance)", desc: "Ghi chép giao dịch, quỹ tiền mặt và dòng tiền thu chi" },
  { key: "REPORTS", name: "Thống kê (Reports)", desc: "Xem báo cáo biểu đồ doanh thu theo ngày, tháng, năm" },
  { key: "USERS", name: "Tài khoản & Phân quyền (Users)", desc: "Quản lý danh sách nhân viên, gán vai trò và cấu hình quyền" },
];

const getDefaultPermissions = (role: string): string[] => {
  switch (role) {
    case "SUPERADMIN":
      return ["DASHBOARD", "ROOMS", "BOOKINGS", "CUSTOMERS", "SERVICES", "INVOICES", "INVENTORY", "FINANCE", "REPORTS", "USERS"];
    case "ADMIN":
    case "MANAGER":
      return ["DASHBOARD", "ROOMS", "BOOKINGS", "CUSTOMERS", "SERVICES", "INVOICES", "INVENTORY", "FINANCE", "REPORTS"];
    case "STAFF":
      return ["DASHBOARD", "ROOMS", "BOOKINGS", "CUSTOMERS", "SERVICES", "INVOICES", "INVENTORY"];
    default:
      return [];
  }
};

export default function EditUserPage() {
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // State quản lý dữ liệu - Không bao gồm password (thường đổi pass ở trang riêng)
  const [formData, setFormData] = useState({
    usercode: "",
    fullName: "",
    email: "",
    phoneNumber: "",
    avatarUrl: "",
    role: "STAFF",
    status: "ACTIVE",
    positionId: "",
    password: "",
    permissions: [] as string[],
  });

  // 1. Khởi tạo dữ liệu: Lấy danh sách chức vụ và thông tin User hiện tại
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // Lấy danh sách chức vụ cho dropdown
        const posData = await UserAPI.getPositions();
        setPositions(Array.isArray(posData) ? posData : (posData?.data || []));

        // Lấy thông tin User theo ID
        const userData = await UserAPI.getUserById(userId);
        if (userData) {
          setFormData({
            usercode: userData.usercode || "",
            fullName: userData.fullName || "",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            avatarUrl: userData.avatarUrl || "",
            role: userData.role || "STAFF",
            status: userData.status || "ACTIVE",
            positionId: userData.positionId?.toString() || "",
            password: "", // Mật khẩu để trống khi edit, chỉ dùng khi admin muốn cấp lại
            permissions: (Array.isArray(userData.permissions) && userData.permissions.length > 0)
              ? userData.permissions
              : getDefaultPermissions(userData.role || "STAFF"),
          });
        }
      } catch (error) {
        console.error("Init Error:", error);
        toast.error("Không thể tải thông tin nhân viên");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [userId]);

  // Tự động đồng bộ Vai trò hệ thống khi thay đổi Chức vụ (chỉ khi đã load xong dữ liệu ban đầu)
  useEffect(() => {
    if (!loading && formData.positionId && positions.length > 0) {
      const selectedPos = positions.find(p => p.id.toString() === formData.positionId);
      if (selectedPos) {
        const name = selectedPos.position_name.toUpperCase();
        let newRole = "STAFF";
        if (name === "ADMIN") {
          newRole = "ADMIN";
        } else if (name.includes("QUẢN LÝ") || name.includes("MANAGER") || name.includes("TRƯỞNG BỘ PHẬN")) {
          newRole = "MANAGER";
        } else {
          newRole = "STAFF";
        }
        setFormData(prev => ({ 
          ...prev, 
          role: newRole,
          permissions: getDefaultPermissions(newRole)
        }));
      }
    }
  }, [formData.positionId, positions, loading]);

  // 2. Xử lý Upload ảnh đại diện bằng FileReader (Chuyển sang Base64 rồi upload lên server local)
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn dung lượng file tải lên (ví dụ: < 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh đại diện phải nhỏ hơn 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await UserAPI.uploadAvatar(base64Data);
          if (res.url) {
            setFormData(prev => ({ ...prev, avatarUrl: res.url }));
            toast.success("Tải ảnh đại diện thành công!");
          } else {
            toast.error("Không nhận được URL ảnh đại diện");
          }
        } catch (uploadError: any) {
          toast.error("Lỗi khi tải ảnh lên server: " + uploadError.message);
        } finally {
          setUploading(false);
        }
      };
    } catch (error: any) {
      toast.error("Không thể xử lý ảnh tải lên: " + error.message);
      setUploading(false);
    }
  };

  // 3. Xử lý lưu thông tin cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    // Xử lý dữ liệu trước khi gửi
    const submitData = {
      ...formData,
      // Kiểm tra kỹ: nếu positionId rỗng thì để null, nếu có thì mới parseInt
      positionId: (formData.positionId && formData.positionId !== "") 
                  ? parseInt(formData.positionId) 
                  : null
    };

    // Gọi API cập nhật
    const res = await UserAPI.updateUser(userId, submitData);
    
    if (res.message === "Cập nhật thành công" || res.id) {
      toast.success("Cập nhật thông tin thành công!");
      setTimeout(() => {
        router.push("/users");
        router.refresh();
      }, 1000);
    } else {
      toast.error(res.message || "Có lỗi xảy ra");
    }
  } catch (error: any) {
    console.error("Update error:", error);
    toast.error(error.message || "Cập nhật thất bại. Vui lòng kiểm tra lại dữ liệu.");
  } finally {
    setSubmitting(false);
  }
};
  

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Đang tải hồ sơ nhân viên...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Chỉnh sửa nhân viên" subtitle={`Cập nhật thông tin cho mã: ${formData.usercode}`} />

        <main className="flex-1 overflow-auto p-6 flex justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-4">
            <Button type="button" variant="ghost" className="mb-2" onClick={() => router.back()}>
              <ChevronLeft className="mr-2 size-4" /> Quay lại danh sách
            </Button>

            <Card className="shadow-lg border-t-4 border-t-blue-600">
              <CardHeader className="border-b bg-background">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Edit3 className="size-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Hồ sơ nhân viên</CardTitle>
                    <CardDescription>Cập nhật thông tin cá nhân và chức vụ hiện tại</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-8">
                {/* PHẦN 1: ẢNH & ĐỊNH DANH */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center gap-4">
                    <Label className="font-medium text-sm">Ảnh đại diện</Label>
                    <div className="relative group size-32 rounded-full border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                      {formData.avatarUrl ? (
                        <>
                          <img src={formData.avatarUrl} className="size-full object-cover" alt="avatar" />
                          <div 
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="text-white size-6" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground text-[10px] cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          {uploading ? <Loader2 className="animate-spin size-6" /> : <Upload className="size-6 mb-1" />}
                          <span>Tải ảnh mới</span>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleUploadImage} className="hidden" accept="image/*" />
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="usercode" className="font-medium">Mã nhân viên (Không được sửa)</Label>
                        <Input id="usercode" value={formData.usercode} disabled className="bg-muted" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fullName" className="font-medium">Họ và tên *</Label>
                        <Input id="fullName" value={formData.fullName} required onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="font-medium">Email công việc *</Label>
                      <Input id="email" type="email" value={formData.email} required onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                </div>

                <hr className="border-dashed" />

                {/* PHẦN 2: LIÊN HỆ & CHỨC VỤ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="grid gap-2">
                      <Label className="font-medium">Chức vụ hiện tại</Label>
                      <Select value={formData.positionId} onValueChange={(val) => setFormData({...formData, positionId: val})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn chức vụ" />
                        </SelectTrigger>
                        <SelectContent>
                          {positions.map((pos) => (
                            <SelectItem key={pos.id} value={pos.id.toString()}>{pos.position_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="grid gap-2">
                      <Label htmlFor="phone" className="font-medium">Số điện thoại</Label>
                      <Input id="phone" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                   </div>
                </div>

                {/* PHẦN 3: PHÂN QUYỀN & TRẠNG THÁI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                       <div className="flex items-center gap-1.5">
                         <Label className="font-medium">Vai trò hệ thống</Label>
                       </div>
                        <Select 
                          value={formData.role} 
                          onValueChange={(val) => setFormData({
                            ...formData, 
                            role: val,
                            permissions: getDefaultPermissions(val)
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SUPERADMIN">SUPERADMIN - Hệ thống Super Admin</SelectItem>
                            <SelectItem value="ADMIN">ADMIN - Quản trị viên</SelectItem>
                            <SelectItem value="MANAGER">MANAGER - Quản lý</SelectItem>
                            <SelectItem value="STAFF">STAFF - Nhân viên</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>

                   <div className="grid gap-2">
                    <Label htmlFor="pass" className="font-medium text-amber-600">Cấp lại mật khẩu (Để trống nếu giữ nguyên)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input 
                        id="pass" 
                        // Thay đổi type dựa trên state showPassword
                        type={showPassword ? "text" : "password"} 
                        placeholder="Nhập mật khẩu mới" 
                        className="pl-9 pr-10 border-amber-200" 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />

                      {/* Nút con mắt nằm ở cuối ô Input */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" /> // Nếu đang hiện thì bấm để ẩn
                        ) : (
                          <Eye className="size-4" />    // Nếu đang ẩn thì bấm để hiện
                        )}
                      </button>
                    </div>
                  </div>

                   
                   <div className="grid gap-2">
                      <Label className="font-medium">Trạng thái tài khoản</Label>
                      <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">ACTIVE - Đang hoạt động</SelectItem>
                          <SelectItem value="LOCKED">LOCKED - Đã khóa</SelectItem>
                          <SelectItem value="INACTIVE">INACTIVE - Ngừng hoạt động</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                 </div>

                <hr className="border-dashed my-6" />

                {/* PHẦN 4: QUYỀN TRUY CẬP CHỨC NĂNG */}
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold text-sm text-primary flex items-center gap-2">
                      <ShieldCheck className="size-5 text-blue-600" />
                      Quyền truy cập chức năng
                    </Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Chọn các phân hệ chức năng cho phép tài khoản này truy cập (Mặc định tự động điền theo Vai trò hệ thống)
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isChecked = formData.permissions.includes(perm.key);
                      return (
                        <label 
                          key={perm.key} 
                          className={`flex items-start p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-all ${
                            isChecked ? "border-blue-200 bg-blue-50/20 shadow-sm" : "border-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            checked={isChecked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => {
                                const newPerms = checked 
                                  ? [...prev.permissions, perm.key]
                                  : prev.permissions.filter(k => k !== perm.key);
                                return { ...prev, permissions: newPerms };
                              });
                            }}
                          />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs text-foreground block">{perm.name}</span>
                            <span className="text-[10px] text-muted-foreground block leading-relaxed">{perm.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t bg-muted/10 p-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>Hủy bỏ</Button>
                <Button type="submit" className="min-w-[150px] shadow-md bg-blue-600 hover:bg-blue-700" disabled={submitting || uploading}>
                  {submitting ? <Loader2 className="animate-spin mr-2 size-4" /> : <Save className="mr-2 size-4" />}
                  Cập nhật hồ sơ
                </Button>
              </CardFooter>
            </Card>

            <div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-700 flex gap-3 border border-blue-100 shadow-sm">
               <Info className="size-5 shrink-0" />
               <div className="space-y-1">
                 <p className="font-bold uppercase tracking-wider">Thông báo hệ thống:</p>
                 <ul className="list-disc pl-4 space-y-1">
                   <li><strong>Mã nhân viên:</strong> Là định danh duy nhất và không thể thay đổi sau khi tạo.</li>
                   <li><strong>Đồng bộ:</strong> Mọi thay đổi về chức vụ sẽ ảnh hưởng ngay lập tức đến các báo cáo liên quan.</li>
                 </ul>
               </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}