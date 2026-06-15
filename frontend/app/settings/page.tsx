"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Moon, Bell, Globe, Database, Info } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen bg-muted/30">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Cài đặt hệ thống" subtitle="Cấu hình chung cho ứng dụng HotelPMS" />
        <main className="flex-1 overflow-auto p-6 flex justify-center">
          <div className="w-full max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5" /> Giao diện & Trải nghiệm
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Chế độ tối (Dark Mode)</Label>
                    <p className="text-sm text-muted-foreground">Chuyển đổi giao diện sang tông màu tối</p>
                  </div>
                  {mounted ? (
                    <Switch 
                      checked={theme === "dark"} 
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                    />
                  ) : (
                    <Switch disabled />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Thông báo hệ thống</Label>
                    <p className="text-sm text-muted-foreground">Nhận thông báo khi có booking mới</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="size-5" /> Thông tin hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 text-sm py-2 border-b">
                  <span className="text-muted-foreground">Phiên bản</span>
                  <span className="font-mono font-bold text-right">v1.2.0-stable</span>
                </div>
                <div className="grid grid-cols-2 text-sm py-2 border-b">
                  <span className="text-muted-foreground">Database Engine</span>
                  <span className="text-right">PostgreSQL 17.0</span>
                </div>
                <div className="grid grid-cols-2 text-sm py-2">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="text-right italic">Vừa xong</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}