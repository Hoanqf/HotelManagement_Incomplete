"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, hasPermission } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  Utensils,
  Receipt,
  Settings,
  Hotel,
  Users,
  ChevronLeft,
  ChevronRight,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Wallet } from "lucide-react";

const navigation = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Quản lý phòng", href: "/rooms", icon: BedDouble },
  { name: "Đặt phòng", href: "/bookings", icon: CalendarDays },
  { name: "Dịch vụ", href: "/services", icon: Utensils },
  { name: "Hóa đơn", href: "/invoices", icon: Receipt },
  { name: "Quản lý kho", href: "/inventory", icon: Warehouse },
  { name: "Tài khoản và phân quyền", href: "/users", icon: Users },
  { name: "Thu chi", href: "/finance", icon: Wallet },
  { name: "Thống kê", href: "/reports", icon: BarChart3 },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const filteredNavigation = navigation.filter((item) => {
    if (!user) return false;
    
    // Map item name to permission key
    let key = "";
    switch (item.name) {
      case "Tổng quan": key = "DASHBOARD"; break;
      case "Quản lý phòng": key = "ROOMS"; break;
      case "Đặt phòng": key = "BOOKINGS"; break;
      case "Dịch vụ": key = "SERVICES"; break;
      case "Hóa đơn": key = "INVOICES"; break;
      case "Quản lý kho": key = "INVENTORY"; break;
      case "Thu chi": key = "FINANCE"; break;
      case "Thống kê": key = "REPORTS"; break;
      case "Tài khoản và phân quyền": key = "USERS"; break;
      default: return true;
    }
    
    return hasPermission(user, key);
  });

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Hotel className="size-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                 PMS Khách Sạn
              </span>

                <span className="text-xs text-muted-foreground">
  Hotel Management
</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("size-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border p-2">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavLink;
          })}

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "mt-2 w-full justify-center text-muted-foreground hover:text-foreground",
              !collapsed && "justify-start px-3"
            )}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span className="ml-2">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
