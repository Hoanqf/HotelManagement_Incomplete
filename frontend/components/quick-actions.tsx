"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarPlus, ClipboardList, Receipt } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "Đặt phòng/ Nhận phòng",
    icon: CalendarPlus,
    href: "/bookings",
    description: "Đặt phòng trước hoặc nhận phòng nhanh",
  },
  {
    label: "Dịch vụ phòng",
    icon: ClipboardList,
    href: "/services",
    description: "Yêu cầu dịch vụ mới",
  },
  {
    label: "Hóa đơn & Thanh toán",
    icon: Receipt,
    href: "/invoices",
    description: "Xem và thanh toán hóa đơn",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto justify-start gap-3 p-3 w-full"
              asChild
            >
              <Link href={action.href}>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <action.icon className="size-4 text-primary" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{action.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
