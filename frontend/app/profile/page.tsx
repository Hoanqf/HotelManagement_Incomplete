"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAPI } from "@/services/user.service";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Lock, Camera, Loader2, Save, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    avatarUrl: user?.avatarUrl || "",
    currentPassword: "",
    newPassword: "",
  });

  // Cập nhật formData khi user từ context đã load xong
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber || "",
        avatarUrl: user.avatarUrl || "",
      }));
    }
  }, [user]);

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const config = await UserAPI.getCloudinaryConfig();
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", config.uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
        method: "POST",
        body: data,
      });
      const fileData = await res.json();
      if (fileData.secure_url) {
        setFormData({ ...formData, avatarUrl: fileData.secure_url });
        toast.success("Cập nhật ảnh đại diện tạm thời, nhấn Lưu để hoàn tất");
      }
    } catch (error) {
      toast.error("Lỗi tải ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await UserAPI.updateUser(user.id, {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        avatarUrl: formData.avatarUrl,
        password: formData.newPassword // Nếu có nhập mới thì mới đổi
      });
      
      if (res.data) {
        updateUser(res.data);
      }
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (error) {
      toast.error("Không thể cập nhật thông tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Hồ sơ cá nhân" subtitle="Quản lý thông tin tài khoản của bạn" />
        <main className="flex-1 overflow-auto p-6 flex justify-center">
          <form onSubmit={handleUpdateProfile} className="w-full max-w-3xl space-y-6">
            <Card className="shadow-md">
              <CardHeader className="border-b">
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="relative size-32 group">
                    <div className="size-full rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted flex items-center justify-center">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} className="size-full object-cover" />
                      ) : (
                        <User className="size-12 text-muted-foreground" />
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      {uploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleUploadAvatar} accept="image/*" />
                  </div>
                  <Badge variant="outline" className="px-3 py-1 uppercase">{user?.role}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Họ và tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input className="pl-9" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email (Liên hệ Admin để đổi)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input className="pl-9 bg-muted" value={user?.email} disabled />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 size-4 text-muted-foreground" />
                      <Input className="pl-9" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Mã nhân viên</Label>
                    <Input className="bg-muted" value={user?.usercode} disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-amber-100">
              <CardHeader className="bg-amber-50/50">
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <Lock className="size-5" /> Bảo mật & Mật khẩu
                </CardTitle>
                <CardDescription>Để trống nếu không muốn thay đổi mật khẩu</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mật khẩu mới</Label>
                    <Input type="password" placeholder="Nhập mật khẩu mới" value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 p-4 flex justify-end">
                <Button type="submit" disabled={loading || uploading}>
                  {loading ? <Loader2 className="mr-2 animate-spin size-4" /> : <Save className="mr-2 size-4" />}
                  Lưu thay đổi
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </div>
  );
}