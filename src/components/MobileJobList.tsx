import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  job_name: string;
  quantity: number;
  date: string;
  notes?: string | null;
}

interface MobileJobCardProps {
  job: Job;
  onApprove: (job: Job) => void;
  onReject: (job: Job) => void;
}

export const MobileJobCard = ({ job, onApprove, onReject }: MobileJobCardProps) => {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    setSwipeX(diff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);

    // Swipe right - approve
    if (swipeX > 100) {
      onApprove(job);
      setSwipeX(0);
      return;
    }

    // Swipe left - reject
    if (swipeX < -100) {
      onReject(job);
      setSwipeX(0);
      return;
    }

    // Reset if not enough swipe
    setSwipeX(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <div className={cn(
          "flex items-center gap-2 text-green-600 transition-opacity",
          swipeX > 50 ? "opacity-100" : "opacity-0"
        )}>
          <CheckCircle className="h-6 w-6" />
          <span className="font-medium">Tasdiqlash</span>
        </div>
        <div className={cn(
          "flex items-center gap-2 text-red-600 transition-opacity",
          swipeX < -50 ? "opacity-100" : "opacity-0"
        )}>
          <span className="font-medium">Rad etish</span>
          <XCircle className="h-6 w-6" />
        </div>
      </div>

      {/* Card content */}
      <Card
        ref={cardRef}
        className={cn(
          "touch-pan-y transition-transform",
          isSwiping ? "transition-none" : "transition-transform duration-200"
        )}
        style={{
          transform: `translateX(${swipeX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-base leading-tight">{job.job_name}</h3>
                <Badge variant="secondary" className="ml-2">
                  {job.quantity} dona
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDate(job.date)}</span>
              </div>
              {job.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">{job.notes}</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>

          {/* Mobile action buttons */}
          <div className="mt-3 flex gap-2 sm:hidden">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onApprove(job)}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Tasdiqlash
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(job)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface MobileJobListProps {
  jobs: Job[];
  onApprove: (job: Job) => void;
  onReject: (job: Job) => void;
}

export const MobileJobList = ({ jobs, onApprove, onReject }: MobileJobListProps) => {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Ishlar topilmadi</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground px-1">
        💡 Maslahat: O'ngga surish - tasdiqlash, chapga - rad etish
      </div>
      {jobs.map((job) => (
        <MobileJobCard
          key={job.id}
          job={job}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
};
