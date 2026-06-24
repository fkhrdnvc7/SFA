import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, CheckCircle, XCircle, Edit } from "lucide-react";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  action: string;
  job_id: string;
  job_name: string;
  user_name: string;
  timestamp: string;
  details: any;
}

interface AuditLogViewerProps {
  jobId?: string;
  limit?: number;
}

const AuditLogViewer = ({ jobId, limit = 50 }: AuditLogViewerProps) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, [jobId]);

  const fetchAuditLogs = async () => {
    try {
      let query = supabase
        .from('incoming_jobs')
        .select(`
          id,
          job_name,
          approval_status,
          approved_at,
          approved_by,
          employer_price_per_unit,
          profiles:approved_by(full_name)
        `)
        .order('approved_at', { ascending: false })
        .limit(limit);

      if (jobId) {
        query = query.eq('id', jobId);
      } else {
        query = query.not('approved_at', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data into audit logs
      const auditLogs: AuditLog[] = (data || []).map(job => ({
        id: job.id,
        action: job.approval_status === 'approved' ? 'tasdiqlandi' : 'rad etildi',
        job_id: job.id,
        job_name: job.job_name,
        user_name: job.profiles?.full_name || 'Noma\'lum',
        timestamp: job.approved_at || '',
        details: {
          price: job.employer_price_per_unit,
          status: job.approval_status,
        },
      }));

      setLogs(auditLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error("Tarixni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    if (action === 'tasdiqlandi') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action === 'rad etildi') return <XCircle className="h-4 w-4 text-red-600" />;
    return <Edit className="h-4 w-4 text-blue-600" />;
  };

  const getActionBadge = (action: string) => {
    if (action === 'tasdiqlandi') return <Badge variant="default">Tasdiqlandi</Badge>;
    if (action === 'rad etildi') return <Badge variant="destructive">Rad etildi</Badge>;
    return <Badge variant="secondary">O'zgartirildi</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Yuklanmoqda...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tarix va Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Hozircha tarix mavjud emas
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="mt-1">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{log.job_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <User className="h-3 w-3" />
                          {log.user_name}
                        </div>
                      </div>
                      {getActionBadge(log.action)}
                    </div>
                    {log.details.price && (
                      <div className="text-sm text-muted-foreground">
                        Narx: {new Intl.NumberFormat('uz-UZ').format(log.details.price)} so'm
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogViewer;
