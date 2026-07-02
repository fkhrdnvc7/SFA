import { useAuth } from "@/lib/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { useTheme } from "@/lib/theme";
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
  Plus,
  Moon,
  Sun,
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
  // {
  //   title: "Ish Beruvchilar",
  //   icon: Building2,
  //   collapsible: true,
  //   items: [
  //     { to: "/employers", label: "Ish beruvchilar", icon: Building2, roles: ["ADMIN", "MANAGER"] },
  //     { to: "/admin-employer-dashboard", label: "Ish beruvchilar dashboard", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  //     { to: "/employer-finance", label: "Ish beruvchi moliya", icon: Wallet, roles: ["ADMIN", "MANAGER"] },
  //   ],
  // },
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
      { to: "/employer-reports", label: "Hisobotlar", icon: BarChart3, roles: ["ISH_BERUVCHI"] },
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
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
  const [expandedSectionsMobile, setExpandedSectionsMobile] = useState<Record<number, boolean>>({});

  const isAdmin = profile?.role === "ADMIN";

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
            {section.collapsible && section.title ? (
              <>
                <button
                  onClick={() => currentToggleSection(sectionIndex)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-body-md font-medium transition-all duration-200",
                    "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  {section.icon && <section.icon className="h-5 w-5 shrink-0" />}
                  <span className="flex-1 text-left">{section.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      currentExpandedSections[sectionIndex] ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    currentExpandedSections[sectionIndex] ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.to;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 text-body-md font-medium transition-all duration-200 ml-2",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                          )}
                        >
                          <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
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
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-body-md font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
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
    <div className="border-t border-sidebar-border p-4 flex flex-col gap-1">
      <div className="mb-2 flex items-center gap-3 rounded-xl bg-sidebar-accent/30 px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{profile?.full_name}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">
            {roleLabel[profile?.role || ""] || profile?.role}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
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
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[150px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[180px]"></div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen glass-sidebar w-64 z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-lg">SFA</span>
          </div>
          <div>
            <h1 className="text-headline-lg-mobile font-semibold text-foreground">SFA Tailoring</h1>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 px-4">
            <NavItems />
          </nav>
        </ScrollArea>

        <SidebarFooter />
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
        {/* Mobile Top bar */}
        <header className="flex lg:hidden items-center justify-between w-full px-3 h-16 sticky top-0 z-40 glass-header">
          {/* Left - Menu + Brand */}
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent shrink-0">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 glass-sidebar border-none p-0">
                <SheetTitle className="sr-only">Navigatsiya</SheetTitle>
                <div className="flex h-16 items-center px-6 border-b border-white/5">
                  <Brand />
                </div>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <nav className="flex flex-col gap-1 p-4">
                    <NavItems onNavigate={() => setOpen(false)} isMobile={true} />
                  </nav>
                </ScrollArea>
                <SidebarFooter onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                SFA
              </div>
              <span className="text-base font-bold whitespace-nowrap">SFA Tailoring</span>
            </div>
          </div>

          {/* Right Side - Theme + Notification + Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className="hover:text-primary transition-colors text-foreground"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {(profile?.role === "ADMIN" || profile?.role === "MANAGER" || profile?.role === "ISH_BERUVCHI") && (
              <NotificationBellEnhanced />
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </div>
          </div>
        </header>

        {/* Desktop Header with Action Button */}
        <header className="hidden lg:flex justify-end items-center px-10 py-6 z-30 sticky top-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                onClick={() => navigate("/jobs")}
                className="glass-button-primary px-6 py-3 rounded-xl flex items-center gap-2 font-medium text-white"
              >
                <Plus className="h-5 w-5" />
                Yangi ish
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="glass-card !rounded-full w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {(profile?.role === "ADMIN" || profile?.role === "MANAGER" || profile?.role === "ISH_BERUVCHI") && (
              <NotificationBellEnhanced />
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:px-10 pb-24 lg:pb-10 pt-0">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      {/* Bottom Navigation (Mobile only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex lg:hidden justify-around items-center px-4 py-3 glass-header shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {profile?.role === "SEAMSTRESS" ? (
          <>
            <NavLink
              to="/dashboard"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <LayoutDashboard className="mb-1 h-5 w-5" />
              Bosh sahifa
            </NavLink>
            <NavLink
              to="/my-tasks"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/my-tasks" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <ClipboardList className="mb-1 h-5 w-5" />
              Vazifalar
            </NavLink>
            <NavLink
              to="/my-earnings"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/my-earnings" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <DollarSign className="mb-1 h-5 w-5" />
              Daromad
            </NavLink>
          </>
        ) : profile?.role === "ISH_BERUVCHI" ? (
          <>
            <NavLink
              to="/employer-dashboard"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/employer-dashboard" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <LayoutDashboard className="mb-1 h-5 w-5" />
              Bosh
            </NavLink>
            <NavLink
              to="/employer-pending-jobs"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/employer-pending-jobs" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <Clock className="mb-1 h-5 w-5" />
              Ishlar
            </NavLink>
            <NavLink
              to="/employer-reports"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/employer-reports" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <BarChart3 className="mb-1 h-5 w-5" />
              Hisobot
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/dashboard"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <LayoutDashboard className="mb-1 h-5 w-5" />
              Bosh sahifa
            </NavLink>
            <NavLink
              to="/jobs"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/jobs" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <Briefcase className="mb-1 h-5 w-5" />
              Ishlar
            </NavLink>
            <NavLink
              to="/reports"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/reports" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <BarChart3 className="mb-1 h-5 w-5" />
              Hisobotlar
            </NavLink>
            <NavLink
              to="/telegram-settings"
              className={cn(
                "flex flex-col items-center justify-center rounded-xl px-4 py-1 text-label-md transition-colors",
                location.pathname === "/telegram-settings" ? "text-primary" : "text-muted-foreground hover:text-white"
              )}
            >
              <Settings className="mb-1 h-5 w-5" />
              Sozlamalar
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
};

export default Layout;
