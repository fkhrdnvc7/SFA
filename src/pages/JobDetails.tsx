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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
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
    if (selectedOperations.length === 0 || !unitPrice) {
      toast.error("Kamida bitta operatsiya va narxni kiriting");
      return;
    }
    try {
      // Har bir tanlangan operatsiya uchun element yaratamiz
      const itemsToInsert = selectedOperations.map(operationId => ({
        job_id: id,
        operation_id: operationId,
        seamstress_id: selectedSeamstress || null,
        color: selectedColor || null,
        size: selectedSize || null,
        quantity: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        bonus_amount: parseFloat(bonusAmount) || 0,
        bonus_note: bonusNote || null,
      }));

      const { error } = await supabase.from('job_items').insert(itemsToInsert);
      if (error) throw error;

      const count = selectedOperations.length;
      toast.success(`${count} ta element qo'shildi`);
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
    setSelectedOperations([]);
    setSelectedSeamstress("");
    setSelectedColor("");
    setSelectedSize("");
    setQuantity("1");
    setUnitPrice("");
    setBonusAmount("0");
    setBonusNote("");
    setEditingItem(null);
  };

  const toggleOperation = (operationId: string) => {
    setSelectedOperations(prev => {
      if (prev.includes(operationId)) {
        return prev.filter(id => id !== operationId);
      } else {
        return [...prev, operationId];
      }
    });
  };



  if (loading || isLoading) return <Layout><div className="flex items-center justify-center h-64"><p>Yuklanmoqda...</p></div></Layout>;
  if (!job) return <Layout><div className="text-center"><p>Topilmadi</p></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')} className="flex-shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold">{job.job_name}</h1>
              <Badge variant={job.status === 'ochiq' ? 'default' : 'secondary'} className="flex-shrink-0">{job.status === 'ochiq' ? 'Ochiq' : 'Yopiq'}</Badge>
            </div>
          </div>
          {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
            <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Element qo'shish</Button></DialogTrigger>
              <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
                <DialogHeader className="flex-shrink-0 px-6 pt-6">
                  <DialogTitle>{editingItem ? "Tahrirlash" : "Yangi element qo'shish"}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? "Elementni tahrirlang" : "Bir nechta operatsiyani tanlash mumkin"}
                  </DialogDescription>
                </DialogHeader>
                 <form id="job-item-form" onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="flex flex-col flex-1 overflow-hidden">
                   <ScrollArea className="flex-1 px-6" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                     <div className="space-y-2.5 pb-2">
                       {!editingItem && (
                         <div className="space-y-1.5">
                           <Label className="text-sm font-medium">Operatsiyalar * (bir nechta tanlash mumkin)</Label>
                           <div className="border rounded-lg p-2 space-y-0.5 max-h-24 overflow-y-auto bg-muted/30">
                             {operations.map((op) => (
                               <div key={op.id} className="flex items-center space-x-2 py-0.5">
                                 <Checkbox
                                   id={`op-${op.id}`}
                                   checked={selectedOperations.includes(op.id)}
                                   onCheckedChange={() => toggleOperation(op.id)}
                                 />
                                 <label
                                   htmlFor={`op-${op.id}`}
                                   className="text-xs sm:text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                 >
                                   {op.name}
                                 </label>
                               </div>
                             ))}
                          </div>
                           {selectedOperations.length > 0 && (
                             <p className="text-xs text-muted-foreground -mt-0.5">
                               ✓ {selectedOperations.length} ta tanlandi
                             </p>
                           )}
                        </div>
                      )}
                       {!editingItem && (
                         <div className="space-y-1">
                           <Label className="text-sm font-medium">Tikuvchi</Label>
                           <Select value={selectedSeamstress} onValueChange={setSelectedSeamstress}>
                             <SelectTrigger className="h-9">
                               <SelectValue placeholder="Tanlang" />
                             </SelectTrigger>
                             <SelectContent className="bg-background">
                               {seamstresses.map((s) => (
                                 <SelectItem key={s.id} value={s.id}>
                                   {s.full_name}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                       )}
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                         <div className="space-y-1">
                           <Label className="text-sm">Rang</Label>
                           <Input
                             value={selectedColor}
                             onChange={(e) => setSelectedColor(e.target.value)}
                             placeholder="Qizil, Ko'k"
                             disabled={!!editingItem}
                             className="h-9"
                           />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-sm">O'lcham</Label>
                           <Input
                             value={selectedSize}
                             onChange={(e) => setSelectedSize(e.target.value)}
                             placeholder="42, 44, 46"
                             disabled={!!editingItem}
                             className="h-9"
                           />
                         </div>
                       </div>
                       <div className="grid grid-cols-3 gap-2.5">
                         <div className="space-y-1">
                           <Label className="text-sm font-medium">Soni *</Label>
                           <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="h-9" />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-sm font-medium">Narx *</Label>
                           <Input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required className="h-9" />
                         </div>
                         <div className="space-y-1">
                           <Label className="text-sm font-medium">Bonus</Label>
                           <Input type="number" step="0.01" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} className="h-9" />
                         </div>
                       </div>
                       <div className="space-y-1">
                         <Label className="text-sm font-medium">Bonus izohi</Label>
                         <Textarea value={bonusNote} onChange={(e) => setBonusNote(e.target.value)} rows={2} className="text-sm resize-none" />
                       </div>
                    </div>
                  </ScrollArea>
                   <div className="flex-shrink-0 pt-3 border-t px-6 pb-5">
                     <Button type="submit" className="w-full h-9">{editingItem ? "Yangilash" : "Qo'shish"}</Button>
                   </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <Card>
          <CardHeader><CardTitle>Ishlar</CardTitle></CardHeader>
          <CardContent className="p-0 sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Operatsiya</TableHead>
                    <TableHead className="whitespace-nowrap">Tikuvchi</TableHead>
                    <TableHead className="whitespace-nowrap">Rang</TableHead>
                    <TableHead className="whitespace-nowrap">O'lcham</TableHead>
                    <TableHead className="whitespace-nowrap">Miqdor</TableHead>
                    <TableHead className="whitespace-nowrap">Narx</TableHead>
                    <TableHead className="whitespace-nowrap">Bonus</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Jami</TableHead>
                    {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && <TableHead className="whitespace-nowrap">Amallar</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{item.operations?.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.profiles?.full_name || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.color || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.size || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.quantity}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.unit_price}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.bonus_amount > 0 ? item.bonus_amount : '—'}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{(item.quantity * item.unit_price) + item.bonus_amount}</TableCell>
                      {(profile?.role === 'ADMIN' || profile?.role === 'MANAGER') && (
                        <TableCell className="whitespace-nowrap">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default JobDetails;
