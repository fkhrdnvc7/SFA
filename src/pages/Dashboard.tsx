import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, DollarSign, Clock, TrendingUp, ClipboardList, Receipt } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState({
    totalJobs: 0,
    openJobs: 0,
    totalEarnings: 0,
    todayAttendance: false
  });
  const [dailyStats, setDailyStats] = useState({
    today: 0,
    yesterday: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    try {
      if (profile?.role === 'SEAMSTRESS') {
        // Get seamstress stats
        const { data: jobItems } = await supabase
          .from('job_items')
          .select('quantity, unit_price, bonus_amount')
          .eq('seamstress_id', user?.id);

        const totalEarnings = jobItems?.reduce((sum, item) => {
          return sum + (item.quantity * item.unit_price) + (item.bonus_amount || 0);
        }, 0) || 0;

        const { data: attendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', user?.id)
          .eq('date', new Date().toISOString().split('T')[0])
          .single();

        setStats({
          totalJobs: jobItems?.length || 0,
          openJobs: 0,
          totalEarnings,
          todayAttendance: !!attendance
        });
      } else {
        // Get manager/admin stats
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*');

        const openJobs = jobs?.filter(j => j.status === 'ochiq').length || 0;

        setStats({
          totalJobs: jobs?.length || 0,
          openJobs,
          totalEarnings: 0,
          todayAttendance: false
        });
        fetchDailyComparison();
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        .from('job_items')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString())
        .lt('created_at', startOfTomorrow.toISOString());

      const { count: yesterdayCount } = await supabase
        .from('job_items')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfYesterday.toISOString())
        .lt('created_at', startOfToday.toISOString());

      setDailyStats({
        today: todayCount || 0,
        yesterday: yesterdayCount || 0,
      });
    } catch (error) {
      console.error('Error fetching daily comparison:', error);
    }
  };

  const dailyDiff = dailyStats.today - dailyStats.yesterday;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bosh sahifa</h1>
          <p className="text-muted-foreground">Xush kelibsiz, {profile?.full_name}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {profile?.role === 'SEAMSTRESS' ? 'Mening ishlarim' : 'Jami ishlar'}
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
            </CardContent>
          </Card>

          {profile?.role !== 'SEAMSTRESS' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ochiq ishlar</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.openJobs}</div>
              </CardContent>
            </Card>
          )}
          {profile?.role !== 'SEAMSTRESS' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Bugungi ishlar</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dailyStats.today}</div>
                <p className="text-xs text-muted-foreground">Kecha: {dailyStats.yesterday}</p>
                <p className={`text-sm font-semibold mt-2 ${dailyDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dailyDiff >= 0 ? '+' : ''}{dailyDiff} ta farq
                </p>
              </CardContent>
            </Card>
          )}

          {profile?.role === 'SEAMSTRESS' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalEarnings.toLocaleString()} so'm
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Bugungi davomat</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.todayAttendance ? '✓' : '—'}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tezkor amallar</CardTitle>
            <CardDescription>Tez-tez ishlatiladigan funksiyalar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto pr-2">
              <div className="space-y-2">
            {profile?.role === 'SEAMSTRESS' && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/attendance')}
                  className="flex-1 p-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Clock className="h-6 w-6 mb-2 mx-auto" />
                  <p className="font-medium">Davomatga belgilash</p>
                </button>
                    <button
                      onClick={() => navigate('/my-tasks')}
                      className="flex-1 p-4 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <ClipboardList className="h-6 w-6 mb-2 mx-auto" />
                      <p className="font-medium">Vazifalarim</p>
                    </button>
                    <button
                      onClick={() => navigate('/my-earnings')}
                      className="flex-1 p-4 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <DollarSign className="h-6 w-6 mb-2 mx-auto" />
                      <p className="font-medium">Daromadlarim</p>
                    </button>
              </div>
            )}
            {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <button
                  onClick={() => navigate('/jobs')}
                  className="p-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Briefcase className="h-6 w-6 mb-2 mx-auto" />
                  <p className="font-medium">Yangi ish yaratish</p>
                </button>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="p-4 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <ClipboardList className="h-6 w-6 mb-2 mx-auto" />
                      <p className="font-medium">Vazifa berish</p>
                    </button>
                    <button
                      onClick={() => navigate('/expenses')}
                      className="p-4 bg-orange-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Receipt className="h-6 w-6 mb-2 mx-auto" />
                      <p className="font-medium">Xarajatlar</p>
                    </button>
                    <button
                      onClick={() => navigate('/incoming-jobs')}
                      className="p-4 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Briefcase className="h-6 w-6 mb-2 mx-auto" />
                      <p className="font-medium">Kelgan ish</p>
                    </button>
                    <button
                      onClick={() => navigate('/revenue')}
                      className="p-4 bg-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <TrendingUp className="h-6 w-6 mb-2 mx-auto" />
                      <p className="font-medium">Daromad</p>
                    </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="p-4 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <TrendingUp className="h-6 w-6 mb-2 mx-auto" />
                      <p className="font-medium">Hisobotlar</p>
                </button>
              </div>
            )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
