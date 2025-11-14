import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface Job {
  id: string;
  job_name: string;
  status: 'ochiq' | 'yopiq';
  created_at: string;
  notes?: string;
}

interface JobItem {
  id: string;
  seamstress_id?: string;
  operation_id: string;
  color?: string;
  size?: string;
  quantity: number;
  unit_price: number;
  bonus_amount: number;
  bonus_note?: string;
  operations: { name: string };
  profiles?: { full_name: string };
}

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [jobItems, setJobItems] = useState<JobItem[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [seamstresses, setSeamstresses] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JobItem | null>(null);
  const [selectedOperation, setSelectedOperation] = useState("");
  const [selectedSeamstress, setSelectedSeamstress] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [bonusAmount, setBonusAmount] = useState("0");
  const [bonusNote, setBonusNote] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile) {
      fetchJobDetails();
      fetchOperations();
      fetchSeamstresses();
      fetchColors();
      fetchSizes();
    }
  }, [user, profile, loading, navigate, id]);

  const fetchJobDetails = async () => {
    try {
      const { data: jobData, error: jobError } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (jobError) throw jobError;
      setJob(jobData);
      const { data: itemsData, error: itemsError } = await supabase.from('job_items').select('*, operations (name), profiles (full_name)').eq('job_id', id);
      if (itemsError) throw itemsError;
      setJobItems(itemsData || []);
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOperations = async () => {
    const { data } = await supabase.from('operations').select('*').order('name');
    setOperations(data || []);
  };

  const fetchSeamstresses = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'SEAMSTRESS').eq('is_active', true).order('full_name');
    setSeamstresses(data || []);
  };

  const fetchColors = async () => {
    const { data } = await supabase.from('colors').select('*').order('name');
    setColors(data || []);
  };

  const fetchSizes = async () => {
    const { data } = await supabase.from('sizes').select('*').order('name');
    setSizes(data || []);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperation || !unitPrice) {
      toast.error("Operatsiya va narxni kiriting");
      return;
    }
    try {
      const { error } = await supabase.from('job_items').insert({
        job_id: id,
        operation_id: selectedOperation,
        seamstress_id: selectedSeamstress || null,
        color: selectedColor || null,
        size: selectedSize || null,
        quantity: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        bonus_amount: parseFloat(bonusAmount) || 0,
        bonus_note: bonusNote || null,
      });
      if (error) throw error;
      toast.success("Qo'shildi");
      resetForm();
      setOpen(false);
      fetchJobDetails();
    } catch (error) {
      toast.error("Xatolik");
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      await supabase.from('job_items').update({
        quantity: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        bonus_amount: parseFloat(bonusAmount) || 0,
        bonus_note: bonusNote || null,
      }).eq('id', editingItem.id);
      toast.success("Yangilandi");
      resetForm();
      setOpen(false);
      fetchJobDetails();
    } catch (error) {
      toast.error("Xatolik");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await supabase.from('job_items').delete().eq('id', itemId);
      toast.success("O'chirildi");
      fetchJobDetails();
    } catch (error) {
      toast.error("Xatolik");
    }
  };

  const handleEditItem = (item: JobItem) => {
    setEditingItem(item);
    setQuantity(item.quantity.toString());
    setUnitPrice(item.unit_price.toString());
    setBonusAmount(item.bonus_amount?.toString() || "0");
    setBonusNote(item.bonus_note || "");
    setOpen(true);
  };

  const resetForm = () => {
    setSelectedOperation("");
    setSelectedSeamstress("");
    setSelectedColor("");
    setSelectedSize("");
    setQuantity("1");
    setUnitPrice("");
    setBonusAmount("0");
    setBonusNote("");
    setEditingItem(null);
  };

  if (loading || isLoading) return <Layout><div className="flex items-center justify-center h-64"><p>Yuklanmoqda...</p></div></Layout>;
  if (!job) return <Layout><div className="text-center"><p>Topilmadi</p></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{job.job_name}</h1>
              <Badge variant={job.status === 'ochiq' ? 'default' : 'secondary'}>{job.status === 'ochiq' ? 'Ochiq' : 'Yopiq'}</Badge>
            </div>
          </div>
          {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
            <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Element qo'shish</Button></DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Tahrirlash" : "Yangi element qo'shish"}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? "Elementni tahrirlang" : "Har safar bitta operatsiya uchun element qo'shing"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
                  {!editingItem && (
                    <div className="space-y-2">
                      <Label>Operatsiya *</Label>
                      <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                        <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>
                          {operations.map((op) => (
                            <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {!editingItem && (
                    <div className="space-y-2">
                      <Label>Tikuvchi</Label>
                      <Select value={selectedSeamstress} onValueChange={setSelectedSeamstress}>
                        <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
                        <SelectContent>{seamstresses.map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rang</Label>
                      <Input
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        placeholder="Masalan: Qizil, Ko'k"
                        disabled={!!editingItem}
                      />
                      <p className="text-xs text-muted-foreground">Vergul bilan ajrating</p>
                    </div>
                    <div className="space-y-2">
                      <Label>O'lcham</Label>
                      <Input
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        placeholder="Masalan: 42, 44, 46"
                        disabled={!!editingItem}
                      />
                      <p className="text-xs text-muted-foreground">Vergul bilan ajrating</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><Label>Soni</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></div>
                    <div><Label>Narx</Label><Input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required /></div>
                    <div><Label>Bonus</Label><Input type="number" step="0.01" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} /></div>
                  </div>
                  <div><Label>Bonus izohi</Label><Textarea value={bonusNote} onChange={(e) => setBonusNote(e.target.value)} rows={2} /></div>
                  <Button type="submit" className="w-full">{editingItem ? "Yangilash" : "Qo'shish"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <Card>
          <CardHeader><CardTitle>Ishlar</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operatsiya</TableHead>
                  <TableHead>Tikuvchi</TableHead>
                  <TableHead>Rang</TableHead>
                  <TableHead>O'lcham</TableHead>
                  <TableHead>Miqdor</TableHead>
                  <TableHead>Narx</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead className="text-right">Jami</TableHead>
                  {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && <TableHead>Amallar</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.operations?.name}</TableCell>
                    <TableCell>{item.profiles?.full_name || '—'}</TableCell>
                    <TableCell>{item.color || '—'}</TableCell>
                    <TableCell>{item.size || '—'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit_price}</TableCell>
                    <TableCell>{item.bonus_amount > 0 ? item.bonus_amount : '—'}</TableCell>
                    <TableCell className="text-right">{(item.quantity * item.unit_price) + item.bonus_amount}</TableCell>
                    {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditItem(item)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default JobDetails;
