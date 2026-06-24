import { useAuth } from "@/lib/auth";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Briefcase,
  Scissors,
  Clock,
  Users,
  BarChart3,
  DollarSign,
  LogOut,
  Menu,
  PackagePlus,
  PackageMinus,
  TrendingUp,
  ClipboardList,
  Receipt,
  Building2,
  Send,
  ChevronDown,
  ChevronRight,
  Settings,
  Wallet,
  UserCog,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import NotificationBell from "@/components/NotificationBell";
import NotificationBellEnhanced from "@/components/NotificationBellEnhanced";

type Role = "ADMIN" | "MANAGER" | "SEAMSTRESS" | "ISH_BERUVCHI";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

interface NavSection {
  title?: string;
  icon?: typeof LayoutDashboard;
  collapsible?: boolean;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  // Dashboard - no title, always first
  {
    items: [
      { to: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "SEAMSTRESS"] },
      { to: "/employer-dashboard", label: "Bosh sahifa", icon: LayoutDashboard, roles: ["ISH_BERUVCHI"] },
    ],
  },
  // Employer's Jobs Section
  {
    title: "Ishlar",
    icon: Briefcase,
    collapsible: true,
    items: [
      { to: "/employer-pending-jobs", label: "Kutilayotgan ishlar", icon: Clock, roles: ["ISH_BERUVCHI"] },
      { to: "/employer-approved-jobs", label: "Tasdiqlangan ishlar", icon: CheckCircle, roles: ["ISH_BERUVCHI"] },
      { to: "/employer-rejected-jobs", label: "Rad etilgan ishlar", icon: XCircle, roles: ["ISH_BERUVCHI"] },
      { to: "/employer-statistics", label: "Statistika", icon: BarChart3, roles: ["ISH_BERUVCHI"] },
    ],
  },
  // Admin Employer Management
  {
    title: "Ish Beruvchilar",
    icon: Building2,
    collapsible: true,
    items: [
      { to: "/employers", label: "Ish beruvchilar", icon: Building2, roles: ["ADMIN", "MANAGER"] },
      { to: "/admin-employer-dashboard", label: "Ish beruvchilar dashboard", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
      { to: "/employer-finance", label: "Ish beruvchi moliya", icon: Wallet, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  // Work Management
  {
    title: "Ish Boshqaruvi",
    icon: Briefcase,
    collapsible: true,
    items: [
      { to: "/jobs", label: "Ishlar", icon: Briefcase, roles: ["ADMIN", "MANAGER"] },
      { to: "/tasks", label: "Vazifa berish", icon: ClipboardList, roles: ["ADMIN", "MANAGER"] },
      { to: "/my-tasks", label: "Vazifalarim", icon: ClipboardList, roles: ["SEAMSTRESS"] },
      { to: "/incoming-jobs", label: "Kelgan ish", icon: PackagePlus, roles: ["ADMIN", "MANAGER"] },
      { to: "/outgoing-jobs-list", label: "Ketgan ish", icon: PackageMinus, roles: ["ADMIN", "MANAGER"] },
      { to: "/operations", label: "Operatsiyalar", icon: Scissors, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  // Finance
  {
    title: "Moliya",
    icon: Wallet,
    collapsible: true,
    items: [
      { to: "/revenue", label: "Daromad", icon: TrendingUp, roles: ["ADMIN", "MANAGER"] },
      { to: "/expenses", label: "Xarajatlar", icon: Receipt, roles: ["ADMIN", "MANAGER"] },
      { to: "/payroll", label: "Oylik maosh", icon: DollarSign, roles: ["ADMIN", "MANAGER"] },
      { to: "/my-earnings", label: "Daromadlarim", icon: DollarSign, roles: ["SEAMSTRESS"] },
    ],
  },
  // People/HR
  {
    title: "Jamoat",
    icon: UserCog,
    collapsible: true,
    items: [
      { to: "/attendance", label: "Davomat", icon: Clock, roles: ["ADMIN"] },
      { to: "/users", label: "Foydalanuvchilar", icon: Users, roles: ["ADMIN"] },
    ],
  },
  // Reports
  {
    title: "Hisobotlar",
    icon: FileText,
    collapsible: true,
    items: [
      { to: "/reports", label: "Hisobotlar", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  // Settings
  {
    title: "Sozlamalar",
    icon: Settings,
    collapsible: true,
    items: [
      { to: "/telegram-settings", label: "Telegram", icon: Send, roles: ["ADMIN"] },
    ],
  },
];

const roleLabel: Record<string, string> = {
  ADMIN: "Administrator",
  MANAGER: "Menejer",
  SEAMSTRESS: "Tikuvchi",
  ISH_BERUVCHI: "Ish beruvchi",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [expandedSectionsMobile, setExpandedSectionsMobile] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleSectionMobile = (index: number) => {
    setExpandedSectionsMobile((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const filteredSections = navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes((profile?.role as Role) || "SEAMSTRESS"),
      ),
    }))
    .filter((section) => section.items.length > 0);

  // Auto-expand section that contains active route
  useEffect(() => {
    filteredSections.forEach((section, index) => {
      if (section.collapsible) {
        const hasActiveItem = section.items.some(item => item.to === location.pathname);
        if (hasActiveItem) {
          setExpandedSections(prev => ({ ...prev, [index]: true }));
          setExpandedSectionsMobile(prev => ({ ...prev, [index]: true }));
        }
      }
    });
  }, [location.pathname]);

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const NavItems = ({ onNavigate, isMobile = false }: { onNavigate?: () => void; isMobile?: boolean }) => {
    const currentExpandedSections = isMobile ? expandedSectionsMobile : expandedSections;
    const currentToggleSection = isMobile ? toggleSectionMobile : toggleSection;

    return (
      <>
        {filteredSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && !section.collapsible && (
              <div className="px-3 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                {section.title}
              </div>
            )}
            {section.collapsible && section.title ? (
              <>
                <button
                  onClick={() => currentToggleSection(sectionIndex)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border-l-2 border-transparent mt-2",
                    "text-sidebar-foreground hover:bg-white/5 hover:text-white",
                  )}
                >
                  {section.icon && <section.icon className="h-5 w-5 shrink-0" />}
                  <span className="flex-1 text-left">{section.title}</span>
                  {currentExpandedSections[sectionIndex] ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                </button>
                {currentExpandedSections[sectionIndex] && (
                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-3 rounded-lg pl-8 pr-3 py-2 text-sm font-medium transition-colors border-l-2 border-transparent",
                            isActive
                              ? "border-sidebar-primary bg-white/10 text-white font-semibold"
                              : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border-l-2 border-transparent",
                      isActive
                        ? "border-sidebar-primary bg-white/10 text-white font-semibold"
                        : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })
            )}
          </div>
        ))}
      </>
    );
  };

  const Brand = () => (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
        SFA
      </div>
      <h1 className="text-lg font-bold text-white">SFA Tailoring</h1>
    </div>
  );

  const SidebarFooter = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="border-t border-sidebar-border p-3">
      <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{profile?.full_name}</p>
          <p className="truncate text-xs text-sidebar-foreground">
            {roleLabel[profile?.role || ""] || profile?.role}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-sidebar-foreground hover:bg-white/5 hover:text-white"
        onClick={() => {
          signOut();
          onNavigate?.();
        }}
      >
        <LogOut className="mr-3 h-5 w-5" />
        Chiqish
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[var(--sidebar-width)] flex-col bg-sidebar lg:flex [--sidebar-width:280px]">
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Brand />
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 p-3">
            <NavItems />
          </nav>
        </ScrollArea>
        <SidebarFooter />
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-[280px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigatsiya</SheetTitle>
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                  <Brand />
                </div>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <nav className="flex flex-col gap-1 p-3">
                    <NavItems onNavigate={() => setOpen(false)} isMobile={true} />
                  </nav>
                </ScrollArea>
                <SidebarFooter onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                SFA
              </div>
              <span className="text-base font-bold">SFA Tailoring</span>
            </div>
          </div>

          {/* Profile chip (desktop) */}
          <div className="hidden items-center gap-3 lg:flex">
            {(profile?.role === "ADMIN" || profile?.role === "MANAGER" || profile?.role === "ISH_BERUVCHI") && (
              <NotificationBellEnhanced />
            )}
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground leading-tight">
                {roleLabel[profile?.role || ""] || profile?.role}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
