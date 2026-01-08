'use client';

import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useAuth";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, LogOut, Receipt, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeSwitcher } from "./ThemeSwitcher";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Incomes", href: "/incomes", icon: Wallet },
  // { label: "E-Paper", href: "/epaper", icon: Newspaper },
  { label: "Users", href: "/users", icon: Users, adminOnly: true },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useProfile();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (!pathname || pathname.startsWith("/auth")) return null;

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-tighter text-primary">EXPENSEBOOK</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut size={18} className="mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
      {/* Mobile Nav */}
      <div className="md:hidden flex items-center justify-around border-t py-2">
        {filteredNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 text-[10px] uppercase font-bold transition-colors",
              pathname === item.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
