import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, DollarSign, Download, Eye, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MonthlyEarnings {
  seamstress_id: string;
  seamstress_name: string;
  total_items: number;
  total_earnings: number;
  paid_status: 'tolangan' | 'tolanmagan' | 'qisman';
  paid_amount: number;
  payroll_record_id?: string;
}

interface JobItemDetail {
  id: string;
  created_at: string;
  operation_name: string;
  job_name: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  bonus_amount: number;
  total: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
  paid: number;
}

interface ChartData {
  name: string;
  value: number;
}

const Payroll = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyEarnings[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  // Payment dialog state
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedSeamstress, setSelectedSeamstress] = useState<MonthlyEarnings | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Detail dialog state
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<JobItemDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER')) {
      fetchMonthlyData();
      fetchMonthlyTrend();
    } else if (profile && profile.role === 'SEAMSTRESS') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate, selectedMonth, selectedYear]);

  const fetchMonthlyTrend = async () => {
    try {
      const trends: MonthlyTrend[] = [];
      const currentYear = parseInt(selectedYear);
      const currentMonth = parseInt(selectedMonth);

      // Get last 6 months including current
      for (let i = 5; i >= 0; i--) {
        let month = currentMonth - i;
        let year = currentYear;

        if (month <= 0) {
          month += 12;
          year -= 1;
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Get job items for this month
        const { data: jobItemsData } = await supabase
          .from('job_items')
          .select('quantity, unit_price, bonus_amount')
          .not('seamstress_id', 'is', null)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        const totalEarnings = jobItemsData?.reduce((sum, item) => {
          return sum + (item.quantity * item.unit_price) + (item.bonus_amount || 0);
        }, 0) || 0;

        // Get paid amount from payroll records
        const { data: payrollData } = await supabase
          .from('payroll_records')
          .select('paid_amount')
          .eq('month', month)
          .eq('year', year);

        const totalPaid = payrollData?.reduce((sum, record) => sum + record.paid_amount, 0) || 0;

        const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
        
        trends.push({
          month: `${monthNames[month - 1]} ${year}`,
          total: totalEarnings,
          paid: totalPaid,
        });
      }

      setMonthlyTrend(trends);
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      setIsLoading(true);
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);

      // Get start and end dates for the selected month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Fetch job items for the month
      const { data: jobItemsData, error: itemsError } = await supabase
        .from('job_items')
        .select(`
          seamstress_id,
          quantity,
          unit_price,
          bonus_amount,
          created_at,
          profiles (full_name)
        `)
        .not('seamstress_id', 'is', null)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (itemsError) throw itemsError;

      // Fetch existing payroll records
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('month', month)
        .eq('year', year);

      if (payrollError) throw payrollError;

      // Process earnings
      const earningsMap = new Map<string, MonthlyEarnings>();

      jobItemsData?.forEach((item: any) => {
        const earnings = (item.quantity * item.unit_price) + (item.bonus_amount || 0);
        
        const existing = earningsMap.get(item.seamstress_id);
        if (existing) {
          existing.total_items += 1;
          existing.total_earnings += earnings;
        } else {
          const payrollRecord = payrollData?.find(p => p.seamstress_id === item.seamstress_id);
          
          earningsMap.set(item.seamstress_id, {
            seamstress_id: item.seamstress_id,
            seamstress_name: item.profiles?.full_name || 'Noma\'lum',
            total_items: 1,
            total_earnings: earnings,
            paid_status: payrollRecord?.status || 'tolanmagan',
            paid_amount: payrollRecord?.paid_amount || 0,
            payroll_record_id: payrollRecord?.id,
          });
        }
      });

      setMonthlyData(Array.from(earningsMap.values()).sort((a, b) => 
        b.total_earnings - a.total_earnings
      ));
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPayment = async () => {
    if (!selectedSeamstress || !paidAmount) return;

    try {
      const amount = parseFloat(paidAmount);
      const totalEarnings = selectedSeamstress.total_earnings;
      
      let status: 'tolangan' | 'tolanmagan' | 'qisman' = 'tolanmagan';
      if (amount >= totalEarnings) {
        status = 'tolangan';
      } else if (amount > 0) {
        status = 'qisman';
      }

      const payrollData = {
        seamstress_id: selectedSeamstress.seamstress_id,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        total_amount: totalEarnings,
        paid_amount: amount,
        status: status,
        payment_date: new Date().toISOString(),
        notes: paymentNotes || null,
        created_by: user?.id,
      };

      if (selectedSeamstress.payroll_record_id) {
        // Update existing record
        const { error } = await supabase
          .from('payroll_records')
          .update(payrollData)
          .eq('id', selectedSeamstress.payroll_record_id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('payroll_records')
          .insert(payrollData);

        if (error) throw error;
      }

      toast.success("To'lov holati yangilandi");
      setPaymentDialog(false);
      setPaidAmount("");
      setPaymentNotes("");
      fetchMonthlyData();
    } catch (error: any) {
      console.error('Error marking payment:', error);
      toast.error("To'lov holatini yangilashda xatolik");
    }
  };

  const handleViewDetails = async (seamstressId: string) => {
    try {
      setDetailsLoading(true);
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('job_items')
        .select(`
          id,
          created_at,
          color,
          size,
          quantity,
          unit_price,
          bonus_amount,
          operations (name),
          jobs (job_name)
        `)
        .eq('seamstress_id', seamstressId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const details: JobItemDetail[] = data.map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        operation_name: item.operations?.name || '',
        job_name: item.jobs?.job_name || '',
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.unit_price,
        bonus_amount: item.bonus_amount || 0,
        total: (item.quantity * item.unit_price) + (item.bonus_amount || 0),
      }));

      setSelectedDetails(details);
      setDetailDialog(true);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error("Tafsilotlarni yuklashda xatolik");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const csvContent = [
      ['Tikuvchi', 'Ishlar soni', 'Jami summa', "To'lov holati", "To'langan summa"].join(','),
      ...monthlyData.map(item => 
        [
          item.seamstress_name,
          item.total_items,
          item.total_earnings,
          item.paid_status,
          item.paid_amount
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `maosh_hisoboti_${selectedYear}_${selectedMonth}.csv`;
    link.click();
    toast.success("Fayl yuklab olindi");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tolangan':
        return <Badge className="bg-green-500">To'langan</Badge>;
      case 'qisman':
        return <Badge variant="secondary">Qisman</Badge>;
      default:
        return <Badge variant="destructive">To'lanmagan</Badge>;
    }
  };

  const months = [
    { value: '1', label: 'Yanvar' },
    { value: '2', label: 'Fevral' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Aprel' },
    { value: '5', label: 'May' },
    { value: '6', label: 'Iyun' },
    { value: '7', label: 'Iyul' },
    { value: '8', label: 'Avgust' },
    { value: '9', label: 'Sentabr' },
    { value: '10', label: 'Oktabr' },
    { value: '11', label: 'Noyabr' },
    { value: '12', label: 'Dekabr' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => {
    const year = currentDate.getFullYear() - 2 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Chart data preparation
  const topEarnersData = monthlyData.slice(0, 8).map(item => ({
    name: item.seamstress_name.split(' ')[0], // First name only for brevity
    summa: item.total_earnings,
  }));

  const paymentStatusData = [
    {
      name: "To'langan",
      value: monthlyData.filter(d => d.paid_status === 'tolangan').length,
      color: '#22c55e',
    },
    {
      name: 'Qisman',
      value: monthlyData.filter(d => d.paid_status === 'qisman').length,
      color: '#94a3b8',
    },
    {
      name: "To'lanmagan",
      value: monthlyData.filter(d => d.paid_status === 'tolanmagan').length,
      color: '#ef4444',
    },
  ].filter(item => item.value > 0);

  const COLORS = ['#22c55e', '#94a3b8', '#ef4444'];

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Oylik maosh hisoboti</h1>
            <p className="text-muted-foreground">Tikuvchilarning oylik daromadlari va statistika</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Oylik tendentsiya
              </CardTitle>
              <CardDescription>Oxirgi 6 oy davomida daromad va to'lovlar</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `${value.toLocaleString()} so'm`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Jami daromad"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="paid" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="To'langan"
                    dot={{ fill: '#22c55e' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Earners Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Eng ko'p ishlaganlar</CardTitle>
              <CardDescription>Ushbu oyda eng yuqori daromadli tikuvchilar</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEarnersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `${value.toLocaleString()} so'm`}
                  />
                  <Bar 
                    dataKey="summa" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                    name="Daromad"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Status Pie Chart */}
          {monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  To'lov holati
                </CardTitle>
                <CardDescription>Tikuvchilar bo'yicha to'lov taqsimoti</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => `${value} kishi`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Oylik umumiy statistika</CardTitle>
              <CardDescription>
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Jami tikuvchilar</span>
                  <span className="text-lg font-bold">{monthlyData.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Jami daromad</span>
                  <span className="text-lg font-bold text-primary">
                    {monthlyData.reduce((sum, item) => sum + item.total_earnings, 0).toLocaleString()} so'm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">To'langan summa</span>
                  <span className="text-lg font-bold text-green-500">
                    {monthlyData.reduce((sum, item) => sum + item.paid_amount, 0).toLocaleString()} so'm
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Qarz summa</span>
                  <span className="text-lg font-bold text-destructive">
                    {monthlyData.reduce((sum, item) => sum + (item.total_earnings - item.paid_amount), 0).toLocaleString()} so'm
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Jami ishlar</span>
                    <span className="text-lg font-bold">
                      {monthlyData.reduce((sum, item) => sum + item.total_items, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">O'rtacha daromad</span>
                    <span className="text-lg font-bold">
                      {monthlyData.length > 0 
                        ? Math.round(monthlyData.reduce((sum, item) => sum + item.total_earnings, 0) / monthlyData.length).toLocaleString() 
                        : 0} so'm
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear} - Maosh hisoboti
            </CardTitle>
            <CardDescription>
              Barcha tikuvchilarning oylik daromadlari va to'lov holati
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg mb-2">Bu oyda ishlar yo'q</p>
                <p className="text-muted-foreground">
                  Tanlangan oyda hech qanday ish bajarilmagan
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tikuvchi</TableHead>
                      <TableHead>Ishlar soni</TableHead>
                      <TableHead>Jami summa</TableHead>
                      <TableHead>To'langan</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map((item) => (
                      <TableRow key={item.seamstress_id}>
                        <TableCell className="font-medium">
                          {item.seamstress_name}
                        </TableCell>
                        <TableCell>{item.total_items}</TableCell>
                        <TableCell className="font-bold">
                          {item.total_earnings.toLocaleString()} so'm
                        </TableCell>
                        <TableCell>
                          {item.paid_amount.toLocaleString()} so'm
                        </TableCell>
                        <TableCell>{getStatusBadge(item.paid_status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(item.seamstress_id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Tafsilot
                            </Button>
                            {item.paid_status !== 'tolangan' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedSeamstress(item);
                                  setPaidAmount(item.paid_amount.toString());
                                  setPaymentDialog(true);
                                }}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                To'lov
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Umumiy summa</p>
                      <p className="text-2xl font-bold">
                        {monthlyData.reduce((sum, item) => sum + item.total_earnings, 0).toLocaleString()} so'm
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        To'langan: {monthlyData.reduce((sum, item) => sum + item.paid_amount, 0).toLocaleString()} so'm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>To'lovni belgilash</DialogTitle>
              <DialogDescription>
                {selectedSeamstress?.seamstress_name} uchun to'lov ma'lumotlarini kiriting
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Jami summa</p>
                <p className="text-2xl font-bold">
                  {selectedSeamstress?.total_earnings.toLocaleString()} so'm
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid-amount">To'langan summa *</Label>
                <Input
                  id="paid-amount"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-notes">Izoh</Label>
                <Textarea
                  id="payment-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="To'lov haqida qo'shimcha ma'lumot..."
                  rows={3}
                />
              </div>
              <Button onClick={handleMarkPayment} className="w-full">
                Saqlash
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tafsilotli hisobot</DialogTitle>
              <DialogDescription>
                Oylik barcha ishlar ro'yxati
              </DialogDescription>
            </DialogHeader>
            {detailsLoading ? (
              <p className="text-center py-8 text-muted-foreground">Yuklanmoqda...</p>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Ish</TableHead>
                      <TableHead>Operatsiya</TableHead>
                      <TableHead>Rang</TableHead>
                      <TableHead>O'lcham</TableHead>
                      <TableHead>Soni</TableHead>
                      <TableHead>Narx</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Jami</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDetails.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell>
                          {new Date(detail.created_at).toLocaleDateString('uz-UZ')}
                        </TableCell>
                        <TableCell>{detail.job_name}</TableCell>
                        <TableCell>{detail.operation_name}</TableCell>
                        <TableCell>{detail.color || '—'}</TableCell>
                        <TableCell>{detail.size || '—'}</TableCell>
                        <TableCell>{detail.quantity}</TableCell>
                        <TableCell>{detail.unit_price.toLocaleString()}</TableCell>
                        <TableCell>{detail.bonus_amount.toLocaleString()}</TableCell>
                        <TableCell className="font-bold">
                          {detail.total.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="pt-4 border-t">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Umumiy</p>
                      <p className="text-2xl font-bold">
                        {selectedDetails.reduce((sum, d) => sum + d.total, 0).toLocaleString()} so'm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Payroll;
