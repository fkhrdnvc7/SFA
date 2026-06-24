import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  id: string;
  job_name: string;
  quantity: number;
  date: string;
}

interface BulkApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
  onSuccess: () => void;
  userId?: string;
}

const BulkApprovalDialog = ({ open, onOpenChange, jobs, onSuccess, userId }: BulkApprovalDialogProps) => {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set(jobs.map(j => j.id)));
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [employerNotes, setEmployerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleJob = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const toggleAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map(j => j.id)));
    }
  };

  const handleBulkApprove = async () => {
    const price = parseFloat(pricePerUnit);
    if (!price || price <= 0) {
      toast.error("Narxni to'g'ri kiriting");
      return;
    }

    if (selectedJobs.size === 0) {
      toast.error("Kamida bitta ishni tanlang");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedJobIds = Array.from(selectedJobs);

      // Update all selected jobs
      const { error } = await supabase
        .from('incoming_jobs')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: userId,
          employer_price_per_unit: price,
          employer_notes: employerNotes || null,
        })
        .in('id', selectedJobIds);

      if (error) throw error;

      // Send notification to admins
      await supabase.from('notifications').insert({
        title: 'Ommaviy tasdiqlash',
        body: `${selectedJobs.size} ta ish tasdiqlandi. Narx: ${price} so'm`,
        type: 'success',
        related_table: 'incoming_jobs',
        related_id: null,
        user_id: null,
      });

      toast.success(`${selectedJobs.size} ta ish tasdiqlandi`);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error in bulk approval:', error);
      toast.error(error.message || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const totalQuantity = jobs
    .filter(j => selectedJobs.has(j.id))
    .reduce((sum, job) => sum + job.quantity, 0);

  const totalPrice = pricePerUnit
    ? parseFloat(pricePerUnit) * totalQuantity
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ommaviy tasdiqlash</DialogTitle>
          <DialogDescription>
            {jobs.length} ta ishni birdan tasdiqlash
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Job Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Ishlar ro'yxati</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAll}
              >
                {selectedJobs.size === jobs.length ? 'Hech birini tanlash' : 'Barchasini tanlash'}
              </Button>
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-4">
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedJobs.has(job.id)}
                      onCheckedChange={() => toggleJob(job.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{job.job_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {job.quantity} dona • {new Date(job.date).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Price Input */}
          <div>
            <Label htmlFor="bulk-price">Narx (dona uchun) *</Label>
            <Input
              id="bulk-price"
              type="number"
              placeholder="Masalan: 15000"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
            />
            {pricePerUnit && selectedJobs.size > 0 && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <div className="text-sm space-y-1">
                  <div>Tanlangan ishlar: <strong>{selectedJobs.size} ta</strong></div>
                  <div>Jami dona: <strong>{totalQuantity}</strong></div>
                  <div>Jami narx: <strong className="text-primary">{formatCurrency(totalPrice)}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="bulk-notes">Izoh (ixtiyoriy)</Label>
            <Textarea
              id="bulk-notes"
              placeholder="Qo'shimcha izoh..."
              value={employerNotes}
              onChange={(e) => setEmployerNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              Bekor qilish
            </Button>
            <Button onClick={handleBulkApprove} disabled={isSubmitting || selectedJobs.size === 0}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Tasdiqlanmoqda...' : `${selectedJobs.size} ta ishni tasdiqlash`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkApprovalDialog;
