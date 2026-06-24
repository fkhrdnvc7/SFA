import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface PriceHistory {
  job_name: string;
  date: string;
  price: number;
  quantity: number;
}

interface PriceStats {
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
}

interface PriceHistoryViewerProps {
  jobName?: string;
  limit?: number;
}

const PriceHistoryViewer = ({ jobName, limit = 10 }: PriceHistoryViewerProps) => {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPriceHistory();
  }, [jobName]);

  const fetchPriceHistory = async () => {
    try {
      let query = supabase
        .from('incoming_jobs')
        .select('job_name, date, employer_price_per_unit, quantity, approval_status')
        .eq('approval_status', 'approved')
        .not('employer_price_per_unit', 'is', null)
        .order('date', { ascending: false })
        .limit(limit);

      if (jobName) {
        query = query.eq('job_name', jobName);
      }

      const { data, error } = await query;

      if (error) throw error;

      const priceHistory: PriceHistory[] = (data || []).map(item => ({
        job_name: item.job_name,
        date: item.date,
        price: item.employer_price_per_unit || 0,
        quantity: item.quantity,
      }));

      setHistory(priceHistory);

      // Calculate statistics
      if (priceHistory.length > 0) {
        const prices = priceHistory.map(h => h.price);
        const average = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);

        // Determine trend (compare first half vs second half)
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (prices.length >= 4) {
          const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
          const secondHalf = prices.slice(Math.floor(prices.length / 2));
          const avgFirst = firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length;
          const avgSecond = secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length;

          if (avgSecond > avgFirst * 1.05) trend = 'up';
          else if (avgSecond < avgFirst * 0.95) trend = 'down';
        }

        setStats({ average, min, max, trend });
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
      toast.error("Narxlar tarixini yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTrendIcon = () => {
    if (!stats) return null;
    if (stats.trend === 'up') return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (stats.trend === 'down') return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (!stats) return '';
    if (stats.trend === 'up') return 'Narx o\'sib bormoqda';
    if (stats.trend === 'down') return 'Narx tushib bormoqda';
    return 'Narx barqaror';
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
          <DollarSign className="h-5 w-5" />
          Narxlar tarixi
        </CardTitle>
        {jobName && <CardDescription>{jobName}</CardDescription>}
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Narxlar tarixi mavjud emas
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Summary */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">O'rtacha</div>
                  <div className="text-lg font-semibold">{formatCurrency(stats.average)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Minimal</div>
                  <div className="text-lg font-semibold text-green-600">{formatCurrency(stats.min)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Maksimal</div>
                  <div className="text-lg font-semibold text-red-600">{formatCurrency(stats.max)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tendensiya</div>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon()}
                    <span className="text-sm">{getTrendText()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Price History List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {history.map((item, index) => {
                  const isHighest = stats && item.price === stats.max;
                  const isLowest = stats && item.price === stats.min;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.job_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(item.date)} • {item.quantity} dona
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(item.price)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.price / item.quantity)} / dona
                        </div>
                        {isHighest && <Badge variant="destructive" className="mt-1">Eng yuqori</Badge>}
                        {isLowest && <Badge variant="default" className="mt-1">Eng past</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceHistoryViewer;
