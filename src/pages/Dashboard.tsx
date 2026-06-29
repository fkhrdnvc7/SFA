import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { supabase } from "@/integrations/supabase/client";
import { formatDateDashboardWithYear } from "@/lib/dateFormat";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Receipt,
  Clock,
  CheckCircle2,
  BarChart3,
  Users,
  PackagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon: typeof Briefcase;
  iconColor: string;
  iconBg: string;
  badge?: { text: string; variant: "success" | "danger" | "warning" };
}

const StatCard = ({ label, value, suffix, icon: Icon, iconColor, iconBg, badge }: StatCardProps) => (
  <div className="glass-card p-6 glass-card-hover">
    {badge && (
      <div className="mb-4">
        <span className={cn(
          "inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-md border",
          badge.variant === "success" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          badge.variant === "danger" && "bg-red-500/10 text-red-400 border-red-500/20",
          badge.variant === "warning" && "bg-blue-400/10 text-blue-400 border-blue-400/20"
        )}>
          <Icon className="h-4 w-4" />
          {badge.text}
        </span>
      </div>
    )}
    <p className="text-body-sm text-muted-foreground mb-2">{label}</p>
    <h3 className="text-5xl font-bold text-foreground leading-none">
      {value}
      {suffix && <span className="text-lg ml-1 text-muted-foreground font-normal">{suffix}</span>}
    </h3>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState({ totalJobs: 0, openJobs: 0, totalEarnings: 0 });
  const [dailyStats, setDailyStats] = useState({ today: 0, yesterday: 0 });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && profile.role === 'ISH_BERUVCHI') {
      // Redirect employer to their own dashboard
      navigate("/employer-dashboard");
    }
  }, [user, loading, profile, navigate]);

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    try {
      if (profile?.role === "SEAMSTRESS") {
        const { data: jobItems } = await supabase
          .from("job_items")
          .select("quantity, unit_price, bonus_amount")
          .eq("seamstress_id", user?.id);

        const totalEarnings =
          jobItems?.reduce((sum, item) => {
            return sum + item.quantity * item.unit_price + (item.bonus_amount || 0);
          }, 0) || 0;

        setStats({ totalJobs: jobItems?.length || 0, openJobs: 0, totalEarnings });
      } else {
        const { data: jobs } = await supabase.from("jobs").select("*");
        const openJobs = jobs?.filter((j) => j.status === "ochiq").length || 0;
        setStats({ totalJobs: jobs?.length || 0, openJobs, totalEarnings: 0 });
        fetchDailyComparison();
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchDailyComparison = async () => {
    try {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfTomorrow = new Date(startOfToday);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);

      const { count: todayCount } = await supabase
        .from("job_items")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfToday.toISOString())
        .lt("created_at", startOfTomorrow.toISOString());

      const { count: yesterdayCount } = await supabase
        .from("job_items")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfYesterday.toISOString())
        .lt("created_at", startOfToday.toISOString());

      setDailyStats({ today: todayCount || 0, yesterday: yesterdayCount || 0 });
    } catch (error) {
      console.error("Error fetching daily comparison:", error);
    }
  };

  const dailyDiff = dailyStats.today - dailyStats.yesterday;
  const today = formatDateDashboardWithYear(new Date());

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  const quickActions =
    profile?.role === "SEAMSTRESS"
      ? [
          { label: "Vazifalarim", icon: ClipboardList, to: "/my-tasks" },
          { label: "Daromadlarim", icon: DollarSign, to: "/my-earnings" },
        ]
      : [
          ...(profile?.role === "ADMIN"
            ? [{ label: "Davomat", icon: Clock, to: "/attendance" }]
            : []),
          { label: "Yangi ish", icon: Briefcase, to: "/jobs" },
          { label: "Vazifa berish", icon: ClipboardList, to: "/tasks" },
          { label: "Xarajatlar", icon: Receipt, to: "/expenses" },
          { label: "Kelgan ish", icon: Briefcase, to: "/incoming-jobs" },
          { label: "Daromad", icon: TrendingUp, to: "/revenue" },
          { label: "Hisobotlar", icon: BarChart3, to: "/reports" },
        ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight">Bosh sahifa</h1>
          <p className="text-body-md text-muted-foreground mt-2">
            Xush kelibsiz, {profile?.full_name}! Bugun {today}
          </p>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label={profile?.role === "SEAMSTRESS" ? "Mening ishlarim" : "Jami ishlar"}
            value={stats.totalJobs}
            suffix="ta"
            icon={Briefcase}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            badge={{ text: "+12%", variant: "success" }}
          />

          {profile?.role !== "SEAMSTRESS" ? (
            <>
              <StatCard
                label="Ochiq ishlar"
                value={stats.openJobs}
                suffix="ta"
                icon={CheckCircle2}
                iconColor="text-emerald-400"
                iconBg="bg-emerald-500/10"
                badge={{ text: "Optimal", variant: "success" }}
              />
              <StatCard
                label="Bugungi ishlar"
                value={dailyStats.today}
                suffix="ta"
                icon={Clock}
                iconColor="text-blue-400"
                iconBg="bg-blue-400/10"
                badge={{
                  text: dailyDiff >= 0 ? `+${dailyDiff}` : `${dailyDiff}`,
                  variant: dailyDiff >= 0 ? "success" : "danger"
                }}
              />
            </>
          ) : (
            <>
              <StatCard
                label="Jami daromad"
                value={stats.totalEarnings.toLocaleString()}
                suffix="so'm"
                icon={DollarSign}
                iconColor="text-emerald-400"
                iconBg="bg-emerald-500/10"
                badge={{ text: "+8.4%", variant: "success" }}
              />
              <div className="glass-card p-6">
                <p className="text-body-sm text-muted-foreground mb-2">Bajarilgan vazifalar</p>
                <h3 className="text-5xl font-bold text-foreground leading-none">0<span className="text-lg ml-1 text-muted-foreground font-normal">ta</span></h3>
              </div>
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tezkor amallar - 2 columns */}
          <div className="lg:col-span-2 glass-card p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-foreground">Tezkor amallar</h3>
              <button className="text-body-sm font-medium text-primary hover:text-foreground transition-colors">
                Barchasi
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.to}
                    onClick={() => navigate(action.to)}
                    className="group flex flex-col items-center justify-center gap-3 rounded-xl glass-button-secondary p-6 text-center transition-all hover:bg-white/10 dark:hover:bg-white/10 min-h-[120px]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bugungi statistika - 1 column */}
          <div className="glass-card p-8 flex flex-col justify-center">
            <h4 className="text-body-md text-muted-foreground mb-6">Bugungi statistika</h4>
            <div className="flex items-center gap-8 mb-6">
              <div>
                <span className="text-6xl font-bold text-foreground block leading-none mb-2">
                  {dailyStats.today}
                </span>
                <span className="text-label-md text-muted-foreground uppercase tracking-wider">
                  BUGUN
                </span>
              </div>
              <div className="w-px h-16 bg-border"></div>
              <div>
                <span className="text-6xl font-bold text-foreground block leading-none mb-2">
                  {dailyStats.yesterday}
                </span>
                <span className="text-label-md text-muted-foreground uppercase tracking-wider">
                  KECHA
                </span>
              </div>
            </div>
            <div className={cn(
              "flex items-center text-sm gap-2 w-fit px-3 py-1.5 rounded-lg border",
              dailyDiff >= 0
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-red-400 bg-red-500/10 border-red-500/20"
            )}>
              {dailyDiff >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {dailyDiff >= 0 ? "Yaxshi natija" : "Kamayish"}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
