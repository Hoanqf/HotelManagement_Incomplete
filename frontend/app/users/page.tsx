"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; 
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAPI } from "@/services/user.service";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { 
  Users, 
  Plus, 
  Shield, 
  UserCheck, 
  Lock, 
  Edit, 
  Briefcase, 
  Loader2, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Fingerprint,
  Trash2,
} from "lucide-react";

// Helper Functions
function roleLabel(role: string) {
  switch (role) {
    case "ADMIN": return "Quản trị viên";
    case "MANAGER": return "Quản lý";
    case "STAFF": return "Nhân viên";
    case "CUSTOMER": return "Khách hàng";
    default: return role;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE": return "Đang hoạt động";
    case "LOCKED": return "Đã khóa";
    case "PENDING": return "Chờ kích hoạt";
    case "INACTIVE": return "Ngừng hoạt động";
    default: return status;
  }
}

function statusClass(status: string) {
  switch (status) {
    case "ACTIVE": return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300";
    case "LOCKED": return "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300";
    case "PENDING": return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300";
    default: return "bg-gray-100 text-gray-700 hover:bg-gray-100 dark:bg-muted";
  }
}

function roleClass(role: string) {
  switch (role) {
    case "ADMIN": return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300";
    case "MANAGER": return "bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300";
    case "STAFF": return "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300";
    default: return "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300";
  }
}

// Permissions Matrix Data
const permissionsData = [
  {
    module: "Tổng quan (Dashboard)",
    admin: { allowed: true, status: "FULL", note: "Xem toàn bộ doanh thu, hoạt động hệ thống" },
    manager: { allowed: true, status: "FULL", note: "Xem toàn bộ hoạt động của chi nhánh" },
    staff: { allowed: true, status: "RESTRICTED", note: "Chỉ xem trạng thái phòng hiện tại" }
  },
  {
    module: "Quản lý phòng (Rooms)",
    admin: { allowed: true, status: "FULL", note: "Thêm, sửa, xóa phòng và thiết lập giá phòng" },
    manager: { allowed: true, status: "RESTRICTED", note: "Cập nhật trạng thái phòng, không được xóa phòng" },
    staff: { allowed: true, status: "RESTRICTED", note: "Chỉ xem trạng thái dọn dẹp và phòng trống" }
  },
  {
    module: "Đặt phòng & Nhận phòng (Bookings)",
    admin: { allowed: true, status: "FULL", note: "Toàn quyền quản lý, hủy phòng đặt" },
    manager: { allowed: true, status: "FULL", note: "Toàn quyền quản lý, xác nhận đặt phòng" },
    staff: { allowed: true, status: "RESTRICTED", note: "Nhập đặt phòng mới, Check-in/Check-out, không được xóa" }
  },
  {
    module: "Dịch vụ phòng (Services)",
    admin: { allowed: true, status: "FULL", note: "Quản lý danh sách dịch vụ khách sạn và đơn giá" },
    manager: { allowed: true, status: "FULL", note: "Quản lý dịch vụ, cập nhật trạng thái hoạt động" },
    staff: { allowed: true, status: "RESTRICTED", note: "Gọi dịch vụ bổ sung cho phòng của khách" }
  },
  {
    module: "Hóa đơn & In ấn (Invoices)",
    admin: { allowed: true, status: "FULL", note: "Xuất hóa đơn, thanh toán, in ấn và xóa hóa đơn" },
    manager: { allowed: true, status: "RESTRICTED", note: "Tạo hóa đơn, thanh toán, in ấn (không được xóa)" },
    staff: { allowed: true, status: "RESTRICTED", note: "Tạo hóa đơn, thanh toán và in bill cho khách" }
  },
  {
    module: "Quản lý Tài chính (Finance)",
    admin: { allowed: true, status: "FULL", note: "Theo dõi thu chi, dòng tiền chi tiết" },
    manager: { allowed: true, status: "FULL", note: "Quản lý chi phí vận hành hàng ngày" },
    staff: { allowed: false, status: "BLOCKED", note: "Không được phép truy cập" }
  },
  {
    module: "Thống kê & Báo cáo (Reports)",
    admin: { allowed: true, status: "FULL", note: "Xem báo cáo tài chính, biểu đồ doanh thu" },
    manager: { allowed: true, status: "RESTRICTED", note: "Xem báo cáo công suất phòng và hoạt động" },
    staff: { allowed: false, status: "BLOCKED", note: "Không được phép truy cập" }
  },
  {
    module: "Tài khoản & Phân quyền (Users)",
    admin: { allowed: true, status: "FULL", note: "Toàn quyền thêm, sửa, khóa tài khoản và phân quyền" },
    manager: { allowed: false, status: "BLOCKED", note: "Không được phép truy cập" },
    staff: { allowed: false, status: "BLOCKED", note: "Không được phép truy cập" }
  }
];

export default function UsersPage() {
  const router = useRouter(); 
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await UserAPI.getUsers();
      
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && Array.isArray(data.data)) { 
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      toast.error("Không thể tải danh sách người dùng");
      setUsers([]); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Lock / Unlock user status
  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === "LOCKED" ? "ACTIVE" : "LOCKED";
    const actionText = newStatus === "ACTIVE" ? "Mở khóa" : "Khóa";

    try {
      const res = await UserAPI.updateUser(user.id, { status: newStatus });
      if (res) {
        setUsers(prev => 
          prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u)
        );
        toast.success(`${actionText} tài khoản thành công!`);
      }
    } catch (error: any) {
      toast.error(`Không thể ${actionText.toLowerCase()} tài khoản. Vui lòng thử lại.`);
    }
  };

  // Delete user account
  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản của nhân viên "${name}" không? Hành động này không thể hoàn tác.`)) {
      try {
        const res = await UserAPI.deleteUser(id);
        if (res) {
          toast.success("Xóa tài khoản thành công!");
          fetchUsers();
        }
      } catch (error: any) {
        toast.error(error.message || "Lỗi khi xóa tài khoản");
      }
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Quản lý tài khoản"
          subtitle="Quản lý nhân sự, vai trò hệ thống và ma trận phân quyền"
        />

        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="accounts" className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <TabsList>
                  <TabsTrigger value="accounts" className="font-semibold">
                    Danh sách tài khoản
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="font-semibold">
                    Ma trận phân quyền
                  </TabsTrigger>
                </TabsList>
              </div>

              <Button onClick={() => router.push('/users/add')} className="self-end sm:self-auto">
                <Plus className="mr-2 size-4" /> Thêm người dùng mới
              </Button>
            </div>

            {/* TAB 1: ACCOUNTS LIST */}
            <TabsContent value="accounts" className="space-y-6">
              {/* Stats Block */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950">
                      <Shield className="size-6 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ban Quản trị / Quản lý</p>
                      <h3 className="text-2xl font-bold">
                        {users.filter((u) => u.role === "ADMIN" || u.role === "MANAGER").length}
                      </h3>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-950">
                      <UserCheck className="size-6 text-green-700 dark:text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nhân viên nghiệp vụ</p>
                      <h3 className="text-2xl font-bold">
                        {users.filter((u) => u.role === "STAFF").length}
                      </h3>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
                      <Lock className="size-6 text-red-700 dark:text-red-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tài khoản bị khóa</p>
                      <h3 className="text-2xl font-bold">
                        {users.filter((u) => u.status === "LOCKED").length}
                      </h3>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="rounded-full bg-gray-100 p-3 dark:bg-muted">
                      <XCircle className="size-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ngừng hoạt động</p>
                      <h3 className="text-2xl font-bold">
                        {users.filter((u) => u.status === "INACTIVE").length}
                      </h3>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Table List */}
              <Card>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-4 text-left font-semibold">Nhân viên</th>
                            <th className="p-4 text-left font-semibold">Chức danh</th>
                            <th className="p-4 text-left font-semibold">Thông tin liên hệ</th>
                            <th className="p-4 text-left font-semibold">Vai trò</th>
                            <th className="p-4 text-left font-semibold">Trạng thái</th>
                            <th className="p-4 text-right font-semibold">Thao tác</th>
                          </tr>
                        </thead>

                        <tbody>
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                Chưa có dữ liệu tài khoản nhân viên.
                              </td>
                            </tr>
                          ) : (
                            users.map((user) => (
                              <tr key={user.id} className="border-b hover:bg-muted/40 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    {user.avatarUrl ? (
                                      <img 
                                        src={user.avatarUrl} 
                                        alt="avatar" 
                                        className="size-10 rounded-full object-cover border" 
                                      />
                                    ) : (
                                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Users className="size-5" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-semibold">{user.fullName || "N/A"}</p>
                                      <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-mono">
                                        Mã: {user.usercode}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Briefcase className="size-3.5 text-muted-foreground" />
                                    <span className="font-medium">
                                      {user.position?.position_name || "N/A"}
                                    </span>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-semibold">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.phoneNumber || "Chưa cập nhật SĐT"}
                                    </p>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <Badge className={roleClass(user.role)}>
                                    {roleLabel(user.role)}
                                  </Badge>
                                </td>

                                <td className="p-4">
                                  <Badge className={statusClass(user.status)}>
                                    {statusLabel(user.status)}
                                  </Badge>
                                </td>

                                <td className="p-4">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-8 px-2"
                                      onClick={() => router.push(`/users/edit/${user.id}`)}
                                    >
                                      <Edit className="mr-1 size-3.5" />
                                      Sửa
                                    </Button>

                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className={`h-8 px-2 ${user.status === 'LOCKED' ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-red-600 border-red-200 hover:bg-red-50'}`}
                                      onClick={() => handleToggleStatus(user)}
                                    >
                                      <Lock className="mr-1 size-3.5" />
                                      {user.status === 'LOCKED' ? 'Mở khóa' : 'Khóa'}
                                    </Button>

                                    {currentUser?.id !== user.id && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                                      >
                                        <Trash2 className="mr-1 size-3.5" />
                                        Xóa
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: ROLE PERMISSIONS MATRIX */}
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="size-5 text-primary" />
                    Bảng phân quyền hệ thống PMS
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-4 text-left font-semibold w-1/4">Phân hệ chức năng</th>
                          <th className="p-4 text-center font-semibold">ADMIN (Quản trị viên)</th>
                          <th className="p-4 text-center font-semibold">MANAGER (Quản lý)</th>
                          <th className="p-4 text-center font-semibold">STAFF (Nhân viên)</th>
                        </tr>
                      </thead>

                      <tbody>
                        {permissionsData.map((perm, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-semibold text-foreground">
                              {perm.module}
                            </td>
                            
                            {/* ADMIN column */}
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  <CheckCircle className="size-3 mr-1" /> Toàn quyền
                                </Badge>
                                <span className="text-[10px] text-muted-foreground block max-w-[150px] mx-auto">
                                  {perm.admin.note}
                                </span>
                              </div>
                            </td>

                            {/* MANAGER column */}
                            <td className="p-4 text-center border-l border-r bg-muted/10">
                              <div className="flex flex-col items-center gap-1">
                                {perm.manager.allowed ? (
                                  perm.manager.status === "FULL" ? (
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                      <CheckCircle className="size-3 mr-1" /> Toàn quyền
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                      <AlertTriangle className="size-3 mr-1" /> Hạn chế
                                    </Badge>
                                  )
                                ) : (
                                  <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                    <XCircle className="size-3 mr-1" /> Chặn
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground block max-w-[150px] mx-auto">
                                  {perm.manager.note}
                                </span>
                              </div>
                            </td>

                            {/* STAFF column */}
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {perm.staff.allowed ? (
                                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    <AlertTriangle className="size-3 mr-1" /> Hạn chế
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                                    <XCircle className="size-3 mr-1" /> Chặn
                                  </Badge>
                                )}
                                <span className="text-[10px] text-muted-foreground block max-w-[150px] mx-auto">
                                  {perm.staff.note}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}