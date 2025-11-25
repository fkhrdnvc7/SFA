import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Edit, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  item_date?: string;
  order_number?: number;
  created_at: string;
  operations: { name: string; code?: string };
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
  
  // Filters
  const [filterSeamstress, setFilterSeamstress] = useState("all");
  const [filterOperation, setFilterOperation] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSize, setFilterSize] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterOrderNumber, setFilterOrderNumber] = useState("");

  // Auto-fill price when operation is selected
  useEffect(() => {
    if (selectedOperation && !editingItem) {
      const operation = operations.find(op => op.id === selectedOperation);
      if (operation && operation.default_price) {
        setUnitPrice(operation.default_price.toString());
      }
    }
  }, [selectedOperation, operations, editingItem]);

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
      await fetchJobItems();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobItems = async () => {
    try {
      const baseQuery = supabase
        .from('job_items')
        .select('*, operations (name, code), profiles (full_name)')
        .eq('job_id', id!);

      // Apply filters conditionally
      const filters: any[] = [];
      if (filterSeamstress && filterSeamstress !== 'all') filters.push(['seamstress_id', filterSeamstress]);
      if (filterOperation && filterOperation !== 'all') filters.push(['operation_id', filterOperation]);
      if (filterDateFrom) filters.push(['item_date', { op: 'gte', value: filterDateFrom }]);
      if (filterDateTo) filters.push(['item_date', { op: 'lte', value: filterDateTo }]);
      if (filterOrderNumber) filters.push(['order_number', parseInt(filterOrderNumber)]);
      
      let query: any = baseQuery;
      filters.forEach(([column, value]) => {
        if (typeof value === 'object' && value?.op === 'gte') {
          query = query.gte(column, value.value);
        } else if (typeof value === 'object' && value?.op === 'lte') {
          query = query.lte(column, value.value);
        } else {
          query = query.eq(column, value);
        }
      });

      if (filterSize) {
        query = query.ilike('size', `%${filterSize}%`);
      }
      if (filterColor) {
        query = query.ilike('color', `%${filterColor}%`);
      }

      // item_date va order_number bilan tartiblash
      const { data: itemsData, error: itemsError } = await query
        .order('item_date', { ascending: true, nullsLast: true })
        .order('order_number', { ascending: true, nullsLast: true });

      if (itemsError) {
        // Agar item_date yoki order_number ustunlari mavjud bo'lmasa, oddiy query qilamiz
        if (itemsError.message?.includes('item_date') || itemsError.message?.includes('order_number')) {
          const { data: fallbackData, error: fallbackError } = await baseQuery
            .order('created_at', { ascending: true });
          if (fallbackError) throw fallbackError;
          setJobItems(fallbackData || []);
          return;
        }
        throw itemsError;
      }
      
      // Ma'lumotlarni tartib raqam va sana bo'yicha guruhlash va tartiblash
      const sortedItems = (itemsData || []).sort((a: any, b: any) => {
        // Avval sana bo'yicha (eng eski birinchi)
        const dateA = new Date(a.item_date || a.created_at).getTime();
        const dateB = new Date(b.item_date || b.created_at).getTime();
        if (dateA !== dateB) {
          return dateA - dateB;
        }
        // Keyin tartib raqam bo'yicha
        const orderA = a.order_number || 0;
        const orderB = b.order_number || 0;
        return orderA - orderB;
      });
      
      setJobItems(sortedItems);
    } catch (error) {
      console.error('Error fetching job items:', error);
      toast.error("Elementlarni yuklashda xatolik");
      setJobItems([]);
    }
  };

  useEffect(() => {
    if (job) {
      fetchJobItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSeamstress, filterOperation, filterDateFrom, filterDateTo, filterSize, filterColor, filterOrderNumber, id]);

  const fetchOperations = async () => {
    const { data } = await supabase.from('operations').select('*').order('code', { ascending: true, nullsFirst: false });
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
      const insertData: any = {
        job_id: id,
        operation_id: selectedOperation,
        seamstress_id: selectedSeamstress || null,
        color: selectedColor || null,
        size: selectedSize || null,
        quantity: parseInt(quantity),
        unit_price: parseFloat(unitPrice),
        bonus_amount: parseFloat(bonusAmount) || 0,
        bonus_note: bonusNote || null,
      };
      
      const { error } = await supabase.from('job_items').insert(insertData);
      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      toast.success("Qo'shildi");
      resetForm();
      setOpen(false);
      fetchJobItems();
    } catch (error) {
      console.error('Error adding item:', error);
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
        color: selectedColor || null,
        size: selectedSize || null,
      }).eq('id', editingItem.id);
      toast.success("Yangilandi");
      resetForm();
      setOpen(false);
      fetchJobItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error("Xatolik");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      await supabase.from('job_items').delete().eq('id', itemId);
      toast.success("O'chirildi");
      fetchJobItems();
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
    setSelectedColor(item.color || "");
    setSelectedSize(item.size || "");
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

  const clearFilters = () => {
    setFilterSeamstress("all");
    setFilterOperation("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterSize("");
    setFilterColor("");
    setFilterOrderNumber("");
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
                            <SelectItem key={op.id} value={op.id}>
                              {op.name}{op.code ? ` (${op.code})` : ''}{op.default_price > 0 ? ` - ${op.default_price.toLocaleString()} so'm` : ''}
                            </SelectItem>
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
                      />
                      <p className="text-xs text-muted-foreground">Vergul bilan ajrating</p>
                    </div>
                    <div className="space-y-2">
                      <Label>O'lcham</Label>
                      <Input
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        placeholder="Masalan: 42, 44, 46"
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtrlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              <div className="space-y-2">
                <Label>Tikuvchi</Label>
                <Select value={filterSeamstress} onValueChange={setFilterSeamstress}>
                  <SelectTrigger>
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
              <div className="space-y-2">
                <Label>Operatsiya</Label>
                <Select value={filterOperation} onValueChange={setFilterOperation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Barchasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {operations.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sana (dan)</Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sana (gacha)</Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>O'lcham</Label>
                <Input
                  value={filterSize}
                  onChange={(e) => setFilterSize(e.target.value)}
                  placeholder="Qidirish..."
                />
              </div>
              <div className="space-y-2">
                <Label>Rang</Label>
                <Input
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  placeholder="Qidirish..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tartib raqami</Label>
                <Input
                  type="number"
                  min="1"
                  value={filterOrderNumber}
                  onChange={(e) => setFilterOrderNumber(e.target.value)}
                  placeholder="Masalan: 5"
                />
              </div>
            </div>
            {((filterSeamstress && filterSeamstress !== 'all') ||
              (filterOperation && filterOperation !== 'all') ||
              filterDateFrom ||
              filterDateTo ||
              filterSize ||
              filterColor ||
              filterOrderNumber) && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Filtrlarni tozalash
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {job.status === 'yopiq' && (
          <Card>
            <CardHeader>
              <CardTitle>Ish ranglari</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const colorsSet = new Set<string>();
                jobItems.forEach(item => {
                  if (item.color) {
                    const colorList = item.color.split(',').map(c => c.trim()).filter(c => c);
                    colorList.forEach(c => colorsSet.add(c));
                  }
                });
                const uniqueColors = Array.from(colorsSet);
                return uniqueColors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map((color, idx) => (
                      <Badge key={idx} variant="outline">
                        {color}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Ranglar ko'rsatilmagan</p>
                );
              })()}
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>Ishlar</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tartib</TableHead>
                    <TableHead>Sana</TableHead>
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
                  {jobItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">
                        Elementlar topilmadi
                      </TableCell>
                    </TableRow>
                  ) : (
                    jobItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.order_number ? `#${item.order_number}` : '—'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const rawDate = item.item_date || item.created_at;
                            return rawDate
                              ? new Date(rawDate).toLocaleDateString('uz-UZ', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })
                              : '—';
                          })()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{item.operations?.name}</div>
                            {item.operations?.code && (
                              <div className="text-xs text-muted-foreground">{item.operations.code}</div>
                            )}
                          </div>
                        </TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default JobDetails;
