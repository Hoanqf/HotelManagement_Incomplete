"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DashboardAPI } from "@/services/dashboard.service";
import {
  BarChart3,
  CalendarCheck,
  DollarSign,
  Hotel,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";

// Ánh xạ các icon
const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  CalendarCheck,
  Hotel,
  Users,
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [bookingSources, setBookingSources] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const loadReportData = async () => {
    try {
      const data = await DashboardAPI.getReportStats();
      setStats(data.stats);
      setRevenueData(data.revenueData);
      setBookingSources(data.bookingSources);
      setRecentReports(data.recentReports);
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu báo cáo thống kê");
      console.error(error);
    }
  };

  useEffect(() => {
    loadReportData().finally(() => setLoading(false));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Tìm giá trị doanh thu lớn nhất để co giãn cột biểu đồ
  const maxRevenue = Math.max(...revenueData.map((item) => item.revenue), 100000);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          title="Thống kê & Báo cáo"
          subtitle="Theo dõi doanh thu, đặt phòng và hiệu suất vận hành khách sạn thực tế"
        />

        <main className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Tổng quan thống kê hoạt động</h2>
                  <p className="text-sm text-muted-foreground">
                    Dữ liệu được cập nhật tự động theo thời gian thực từ sổ quỹ và đặt phòng
                  </p>
                </div>
              </div>

              {/* Hàng thẻ thống kê */}
              <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => {
                  const Icon = iconMap[item.iconName] || DollarSign;
                  const isPositive = item.description.includes("+");

                  return (
                    <Card key={item.title}>
                      <CardContent className="flex items-center justify-between p-5">
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">
                            {item.title}
                          </p>
                          <h3 className="mt-2 text-2xl font-bold">
                            {item.value}
                          </h3>
                          <p className={`mt-1 text-xs ${isPositive ? "text-green-600" : "text-muted-foreground"}`}>
                            {item.description}
                          </p>
                        </div>

                        <div className="rounded-full bg-primary/10 p-3">
                          <Icon className="size-6 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Hàng biểu đồ và phân tích nguồn */}
              <div className="mb-6 grid gap-6 lg:grid-cols-2">
                {/* Biểu đồ cột Doanh thu */}
                <Card>
                  <CardHeader className="text-left">
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <BarChart3 className="size-5 text-primary" />
                      Doanh thu & Chi phí 6 tháng gần nhất
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="flex h-64 items-end gap-4 px-2 pt-6">
                      {revenueData.map((item) => (
                        <div
                          key={item.month}
                          className="flex flex-1 flex-col items-center gap-2 group relative"
                        >
                          {/* Cột chính hiển thị doanh thu */}
                          <div
                            className="w-full rounded-t bg-primary/80 group-hover:bg-primary transition-colors cursor-pointer relative"
                            style={{ height: `${Math.max(10, (item.revenue / maxRevenue) * 180)}px` }}
                          >
                            {/* Tooltip khi di chuột */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900/95 text-white text-[11px] p-2.5 rounded-md shadow-xl border border-slate-700 whitespace-nowrap z-50 transition-opacity">
                              <p className="font-bold border-b border-slate-700 pb-1 mb-1 text-center text-primary">{item.month}</p>
                              <p className="flex justify-between gap-4"><span>Thu (Income):</span> <span className="font-semibold text-emerald-400">{formatCurrency(item.revenue)}</span></p>
                              <p className="flex justify-between gap-4"><span>Chi (Expense):</span> <span className="font-semibold text-rose-400">{formatCurrency(item.expense)}</span></p>
                              <p className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1 font-bold"><span>Lãi (Profit):</span> <span className={item.profit >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatCurrency(item.profit)}</span></p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground font-semibold">
                            {item.month}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-4 text-center">
                      💡 Di chuột vào các cột mốc tháng để xem chi tiết Thu / Chi / Lợi nhuận ròng.
                    </p>
                  </CardContent>
                </Card>

                {/* Phân tích nguồn đặt phòng */}
                <Card>
                  <CardHeader className="text-left">
                    <CardTitle className="flex items-center gap-2 text-base font-bold">
                      <TrendingUp className="size-5 text-primary" />
                      Tỷ lệ nguồn đặt phòng
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {bookingSources.length > 0 ? (
                      bookingSources.map((item) => (
                        <div key={item.source}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium">{item.source}</span>
                            <span className="font-semibold text-muted-foreground">{item.value}% ({item.count} đơn)</span>
                          </div>

                          <div className="h-2 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-60 flex items-center justify-center text-muted-foreground">
                        Chưa có dữ liệu nguồn đặt phòng.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Bảng báo cáo gần đây */}
              <Card>
                <CardHeader className="text-left">
                  <CardTitle className="text-base font-bold">Lịch sử giao dịch sổ quỹ gần đây</CardTitle>
                </CardHeader>

                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="py-3 text-left font-semibold">Tên phiếu giao dịch / Báo cáo</th>
                        <th className="py-3 text-left font-semibold">Ngày ghi nhận</th>
                        <th className="py-3 text-left font-semibold">Phân loại</th>
                        <th className="py-3 text-right font-semibold">Số tiền</th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentReports.length > 0 ? (
                        recentReports.map((report: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="py-3 font-medium text-left">{report.name}</td>
                            <td className="py-3 text-left">{report.date}</td>
                            <td className="py-3 text-left">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                report.type === "INCOME" 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                  : "bg-rose-50 text-rose-700 border border-rose-100"
                              }`}>
                                {report.type === "INCOME" ? "Thu" : "Chi"}
                              </span>
                            </td>
                            <td className={`py-3 text-right font-semibold ${
                              report.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                            }`}>
                              {report.type === "INCOME" ? "+" : "-"}{formatCurrency(report.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-muted-foreground">
                            Chưa có báo cáo thu chi nào được ghi nhận.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}