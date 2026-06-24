import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon: typeof Briefcase;
  tone?: "primary" | "success" | "warning" | "danger";
  trend?: { value: string; up: boolean; note: string };
}

const toneClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
};

const StatCard = ({ label, value, suffix, icon: Icon, tone = "primary", trend }: StatCardProps) => (
  <Card className="transition-shadow hover:shadow-sm">
    <CardContent className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <h3 className="text-stat-display text-foreground">
            {value}
            {suffix && <span className="ml-1 text-lg font-medium text-muted-foreground">{suffix}</span>}
          </h3>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1.5 text-sm">
          {trend.up ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={cn("font-medium", trend.up ? "text-emerald-600" : "text-red-600")}>
            {trend.value}
          </span>
          <span className="text-muted-foreground">{trend.note}</span>
        </div>
      )}
    </CardContent>
  </Card>
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
  const today = new Date().toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
          <h1 className="text-page-title">Bosh sahifa</h1>
          <p className="text-muted-foreground">
            Xush kelibsiz, {profile?.full_name}! Bugun {today}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={profile?.role === "SEAMSTRESS" ? "Mening ishlarim" : "Jami ishlar"}
            value={stats.totalJobs}
            suffix="ta"
            icon={Briefcase}
            tone="primary"
          />

          {profile?.role !== "SEAMSTRESS" && (
            <>
              <StatCard
                label="Ochiq ishlar"
                value={stats.openJobs}
                suffix="ta"
                icon={CheckCircle2}
                tone="success"
              />
              <StatCard
                label="Bugungi ishlar"
                value={dailyStats.today}
                suffix="ta"
                icon={Clock}
                tone="warning"
                trend={{
                  value: `${dailyDiff >= 0 ? "+" : ""}${dailyDiff} ta`,
                  up: dailyDiff >= 0,
                  note: `kecha: ${dailyStats.yesterday}`,
                }}
              />
            </>
          )}

          {profile?.role === "SEAMSTRESS" && (
            <StatCard
              label="Jami daromad"
              value={stats.totalEarnings.toLocaleString()}
              suffix="so'm"
              icon={DollarSign}
              tone="success"
            />
          )}
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-section-title">Tezkor amallar</CardTitle>
            <CardDescription>Tez-tez ishlatiladigan funksiyalar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.to}
                    onClick={() => navigate(action.to)}
                    className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
