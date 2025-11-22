import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, LogIn, LogOut, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  time_in?: string;
  time_out?: string;
  status?: string;
  profiles?: { full_name: string };
}

const Attendance = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [seamstresses, setSeamstresses] = useState<any[]>([]);
  const [selectedSeamstress, setSelectedSeamstress] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isMarkDialogOpen, setIsMarkDialogOpen] = useState(false);
  const [markDate, setMarkDate] = useState(new Date().toISOString().split('T')[0]);
  const [markSeamstress, setMarkSeamstress] = useState("");
  const [markStatus, setMarkStatus] = useState("present");
  const [markTimeIn, setMarkTimeIn] = useState("");
  const [markTimeOut, setMarkTimeOut] = useState("");
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile) {
      fetchAttendance();
      if (profile.role === 'ADMIN' || profile.role === 'MANAGER') {
        fetchSeamstresses();
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    applyFilters();
  }, [attendance, selectedSeamstress, startDate, endDate]);

  const fetchSeamstresses = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'SEAMSTRESS')
      .eq('is_active', true)
      .order('full_name');
    setSeamstresses(data || []);
  };

  const fetchAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's attendance
      const { data: todayData } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .maybeSingle();

      setTodayAttendance(todayData);

      // Get all attendance records
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('date', { ascending: false })
        .order('time_in', { ascending: false })
        .limit(100);

      if (profile?.role === 'SEAMSTRESS') {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAttendance(data || []);
      setFilteredAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error("Davomat ma'lumotlarini yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attendance];

    if (selectedSeamstress !== "all") {
      filtered = filtered.filter(record => record.user_id === selectedSeamstress);
    }

    if (startDate) {
      filtered = filtered.filter(record => record.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(record => record.date <= endDate);
    }

    setFilteredAttendance(filtered);
  };

  const handleCheckIn = async () => {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: user?.id,
          date: new Date().toISOString().split('T')[0],
          time_in: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Kelganingiz belgilandi");
      fetchAttendance();
    } catch (error: any) {
      console.error('Error checking in:', error);
      toast.error("Belgilashda xatolik");
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          time_out: new Date().toISOString(),
        })
        .eq('id', todayAttendance.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success("Ketganingiz belgilandi");
      fetchAttendance();
    } catch (error: any) {
      console.error('Error checking out:', error);
      toast.error("Belgilashda xatolik");
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (timeIn?: string, timeOut?: string) => {
    if (!timeIn || !timeOut) return '—';
    const start = new Date(timeIn);
    const end = new Date(timeOut);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}s ${minutes}d`;
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markSeamstress || !markDate) {
      toast.error("Ishchi va sanani tanlang");
      return;
    }

    try {
      const attendanceData: any = {
        user_id: markSeamstress,
        date: markDate,
        status: markStatus,
      };

      if (markStatus === 'present') {
        if (markTimeIn) {
          const [hours, minutes] = markTimeIn.split(':');
          const date = new Date(markDate);
          date.setHours(parseInt(hours), parseInt(minutes), 0);
          attendanceData.time_in = date.toISOString();
        }
        if (markTimeOut) {
          const [hours, minutes] = markTimeOut.split(':');
          const date = new Date(markDate);
          date.setHours(parseInt(hours), parseInt(minutes), 0);
          attendanceData.time_out = date.toISOString();
        }
      }

      // Check if record exists
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', markSeamstress)
        .eq('date', markDate)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('attendance')
          .update(attendanceData)
          .eq('id', existing.id);
        if (error) throw error;
        toast.success("Davomat yangilandi");
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert(attendanceData);
        if (error) throw error;
        toast.success("Davomat belgilandi");
      }

      setIsMarkDialogOpen(false);
      setMarkDate(new Date().toISOString().split('T')[0]);
      setMarkSeamstress("");
      setMarkStatus("present");
      setMarkTimeIn("");
      setMarkTimeOut("");
      fetchAttendance();
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      toast.error("Davomat belgilashda xatolik");
    }
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.status === 'absent') {
      return <Badge variant="destructive">Kelmagan</Badge>;
    }
    if (record.status === 'not_written') {
      return <Badge variant="secondary">Yozilmagan</Badge>;
    }
    if (record.time_in) {
      return <Badge variant="default">Kelgan</Badge>;
    }
    return <Badge variant="outline">—</Badge>;
  };

  const handleEditRecord = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setMarkSeamstress(record.user_id);
    setMarkDate(record.date);
    setMarkStatus(record.status || (record.time_in ? 'present' : 'not_written'));
    
    if (record.time_in) {
      const date = new Date(record.time_in);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setMarkTimeIn(`${hours}:${minutes}`);
    } else {
      setMarkTimeIn("");
    }
    
    if (record.time_out) {
      const date = new Date(record.time_out);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      setMarkTimeOut(`${hours}:${minutes}`);
    } else {
      setMarkTimeOut("");
    }
    
    setIsEditDialogOpen(true);
  };

  const handleUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const attendanceData: any = {
        status: markStatus,
      };

      if (markStatus === 'present') {
        if (markTimeIn) {
          const [hours, minutes] = markTimeIn.split(':');
          const date = new Date(markDate);
          date.setHours(parseInt(hours), parseInt(minutes), 0);
          attendanceData.time_in = date.toISOString();
        } else {
          attendanceData.time_in = null;
        }
        if (markTimeOut) {
          const [hours, minutes] = markTimeOut.split(':');
          const date = new Date(markDate);
          date.setHours(parseInt(hours), parseInt(minutes), 0);
          attendanceData.time_out = date.toISOString();
        } else {
          attendanceData.time_out = null;
        }
      } else {
        attendanceData.time_in = null;
        attendanceData.time_out = null;
      }

      const { error } = await supabase
        .from('attendance')
        .update(attendanceData)
        .eq('id', editingRecord.id);

      if (error) throw error;

      toast.success("Davomat yangilandi");
      setIsEditDialogOpen(false);
      setEditingRecord(null);
      setMarkDate(new Date().toISOString().split('T')[0]);
      setMarkSeamstress("");
      setMarkStatus("present");
      setMarkTimeIn("");
      setMarkTimeOut("");
      fetchAttendance();
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast.error("Davomat yangilashda xatolik");
    }
  };

  const resetEditForm = () => {
    setEditingRecord(null);
    setMarkDate(new Date().toISOString().split('T')[0]);
    setMarkSeamstress("");
    setMarkStatus("present");
    setMarkTimeIn("");
    setMarkTimeOut("");
  };

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
        <div>
          <h1 className="text-3xl font-bold">Davomat</h1>
          <p className="text-muted-foreground">Keldi-ketdi tizimi</p>
        </div>

        {profile?.role === 'SEAMSTRESS' && (
          <Card>
            <CardHeader>
              <CardTitle>Bugungi davomat</CardTitle>
            </CardHeader>
            <CardContent>
              {!todayAttendance ? (
                <div className="text-center py-8">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg mb-4">Bugun hali belgilanmagan</p>
                  <Button size="lg" onClick={handleCheckIn}>
                    <LogIn className="h-5 w-5 mr-2" />
                    Kelganimni belgilash
                  </Button>
                </div>
              ) : !todayAttendance.time_out ? (
                <div className="text-center py-8">
                  <div className="flex justify-center items-center gap-2 mb-4">
                    <Clock className="h-16 w-16 text-primary" />
                  </div>
                  <p className="text-lg mb-2">
                    Kelgan vaqt: <span className="font-bold">{formatTime(todayAttendance.time_in)}</span>
                  </p>
                  <p className="text-muted-foreground mb-4">Ish jarayonida...</p>
                  <Button size="lg" variant="outline" onClick={handleCheckOut}>
                    <LogOut className="h-5 w-5 mr-2" />
                    Ketganimni belgilash
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-lg mb-2">
                    Kelgan: <span className="font-bold">{formatTime(todayAttendance.time_in)}</span>
                  </p>
                  <p className="text-lg mb-2">
                    Ketgan: <span className="font-bold">{formatTime(todayAttendance.time_out)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Umumiy: {calculateDuration(todayAttendance.time_in, todayAttendance.time_out)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle>Davomat tarixi</CardTitle>
                {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                  <Dialog open={isMarkDialogOpen} onOpenChange={setIsMarkDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Davomat belgilash
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Davomat belgilash</DialogTitle>
                        <DialogDescription>
                          Ishchi uchun davomat belgilang
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleMarkAttendance} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Ishchi *</Label>
                          <Select value={markSeamstress} onValueChange={setMarkSeamstress} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Tanlang" />
                            </SelectTrigger>
                            <SelectContent>
                              {seamstresses.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Sana *</Label>
                          <Input
                            type="date"
                            value={markDate}
                            onChange={(e) => setMarkDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Holat *</Label>
                          <Select value={markStatus} onValueChange={setMarkStatus} required>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Kelgan</SelectItem>
                              <SelectItem value="absent">Kelmagan</SelectItem>
                              <SelectItem value="not_written">Yozilmagan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {markStatus === 'present' && (
                          <>
                            <div className="space-y-2">
                              <Label>Kelgan vaqt</Label>
                              <Input
                                type="time"
                                value={markTimeIn}
                                onChange={(e) => setMarkTimeIn(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Ketgan vaqt</Label>
                              <Input
                                type="time"
                                value={markTimeOut}
                                onChange={(e) => setMarkTimeOut(e.target.value)}
                              />
                            </div>
                          </>
                        )}
                        <Button type="submit" className="w-full">
                          Saqlash
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                  setIsEditDialogOpen(open);
                  if (!open) resetEditForm();
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Davomatni tahrirlash</DialogTitle>
                      <DialogDescription>
                        Davomat ma'lumotlarini o'zgartiring
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateAttendance} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ishchi</Label>
                        <Input
                          value={editingRecord?.profiles?.full_name || ''}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sana</Label>
                        <Input
                          type="date"
                          value={markDate}
                          onChange={(e) => setMarkDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Holat *</Label>
                        <Select value={markStatus} onValueChange={setMarkStatus} required>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Kelgan</SelectItem>
                            <SelectItem value="absent">Kelmagan</SelectItem>
                            <SelectItem value="not_written">Yozilmagan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {markStatus === 'present' && (
                        <>
                          <div className="space-y-2">
                            <Label>Kelgan vaqt</Label>
                            <Input
                              type="time"
                              value={markTimeIn}
                              onChange={(e) => setMarkTimeIn(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ketgan vaqt</Label>
                            <Input
                              type="time"
                              value={markTimeOut}
                              onChange={(e) => setMarkTimeOut(e.target.value)}
                            />
                          </div>
                        </>
                      )}
                      <Button type="submit" className="w-full">
                        Yangilash
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                <div className="flex gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Ishchi:</Label>
                    <Select value={selectedSeamstress} onValueChange={setSelectedSeamstress}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Barchasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Barchasi</SelectItem>
                        {seamstresses.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Dan:</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">Gacha:</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                  {(startDate || endDate || selectedSeamstress !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setSelectedSeamstress("all");
                      }}
                    >
                      Tozalash
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredAttendance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Hozircha ma'lumotlar yo'q
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                      <TableHead>Ism</TableHead>
                    )}
                    <TableHead>Sana</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Kelgan</TableHead>
                    <TableHead>Ketgan</TableHead>
                    <TableHead>Davomiyligi</TableHead>
                    {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                      <TableHead>Amallar</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                        <TableCell className="font-medium">
                          {record.profiles?.full_name}
                        </TableCell>
                      )}
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('uz-UZ')}
                      </TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      <TableCell>{formatTime(record.time_in)}</TableCell>
                      <TableCell>{formatTime(record.time_out)}</TableCell>
                      <TableCell>
                        {calculateDuration(record.time_in, record.time_out)}
                      </TableCell>
                      {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Attendance;
