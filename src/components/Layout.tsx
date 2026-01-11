import { useAuth } from "@/lib/auth";
import { useNavigate, useLocation } from "react-router-dom";
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
  Receipt
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import logo from "@/assets/logo.svg";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navigationItems = [
    { to: "/dashboard", label: "Bosh sahifa", icon: LayoutDashboard },
    { to: "/jobs", label: "Ishlar", icon: Briefcase, roles: ['ADMIN', 'MANAGER'] },
    { to: "/tasks", label: "Vazifa berish", icon: ClipboardList, roles: ['ADMIN', 'MANAGER'] },
    { to: "/my-tasks", label: "Vazifalarim", icon: ClipboardList, roles: ['SEAMSTRESS'] },
    { to: "/incoming-jobs", label: "Kelgan ish", icon: PackagePlus, roles: ['ADMIN', 'MANAGER'] },
    { to: "/outgoing-jobs-list", label: "Ketgan ish", icon: PackageMinus, roles: ['ADMIN', 'MANAGER'] },
    { to: "/revenue", label: "Daromad", icon: TrendingUp, roles: ['ADMIN', 'MANAGER'] },
    { to: "/expenses", label: "Xarajatlar", icon: Receipt, roles: ['ADMIN', 'MANAGER'] },
    { to: "/operations", label: "Operatsiyalar", icon: Scissors, roles: ['ADMIN', 'MANAGER'] },
    { to: "/attendance", label: "Davomat", icon: Clock },
    { to: "/my-earnings", label: "Daromadlarim", icon: DollarSign, roles: ['SEAMSTRESS'] },
    { to: "/payroll", label: "Oylik maosh", icon: DollarSign, roles: ['ADMIN', 'MANAGER'] },
    { to: "/users", label: "Foydalanuvchilar", icon: Users, roles: ['ADMIN'] },
    { to: "/reports", label: "Hisobotlar", icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
  ];

  const filteredItems = navigationItems.filter(
    item => !item.roles || item.roles.includes(profile?.role || 'SEAMSTRESS')
  );

  const NavItems = () => (
    <>
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-foreground'
            }`}
            onClick={() => setOpen(false)}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden border-b bg-card sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="SFA Tailoring logo" className="h-7 w-7" />
            <h1 className="text-xl font-bold">SFA Tailoring</h1>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <div className="space-y-2">
                <NavItems />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Chiqish
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-card h-screen sticky top-0 flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <img src={logo} alt="SFA Tailoring logo" className="h-9 w-9" />
              <h1 className="text-2xl font-bold">SFA Tailoring</h1>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 pt-4">
            <nav className="space-y-2">
              <NavItems />
            </nav>
          </div>
          </ScrollArea>
          <div className="p-6 border-t mt-auto">
            <div className="mb-4 p-3 bg-accent rounded-lg">
              <p className="text-sm font-medium">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{profile?.role}</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={signOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Chiqish
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
