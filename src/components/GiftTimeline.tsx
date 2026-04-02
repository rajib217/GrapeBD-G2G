import { CheckCircle2, Clock, ThumbsUp, Truck, PackageCheck, XCircle } from 'lucide-react';

interface GiftTimelineProps {
  status: string;
  createdAt?: string;
  approvedAt?: string | null;
  sentAt?: string | null;
  receivedAt?: string | null;
}

const steps = [
  { key: 'pending', label: 'পেন্ডিং', icon: Clock, color: 'text-yellow-500' },
  { key: 'approved', label: 'অনুমোদিত', icon: ThumbsUp, color: 'text-blue-500' },
  { key: 'sent', label: 'প্রেরিত', icon: Truck, color: 'text-purple-500' },
  { key: 'received', label: 'প্রাপ্ত', icon: PackageCheck, color: 'text-accent' },
];

const statusOrder: Record<string, number> = {
  pending: 0, approved: 1, sent: 2, received: 3, cancelled: -1
};

const formatDate = (d?: string | null) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
};

const GiftTimeline = ({ status, createdAt, approvedAt, sentAt, receivedAt }: GiftTimelineProps) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-2">
        <XCircle className="w-4 h-4" />
        <span className="font-medium">বাতিল হয়েছে</span>
      </div>
    );
  }

  const currentStep = statusOrder[status] ?? 0;
  const dates = [
    formatDate(createdAt),
    formatDate(approvedAt),
    formatDate(sentAt),
    formatDate(receivedAt),
  ];

  return (
    <div className="flex items-center w-full py-2 overflow-x-auto">
      {steps.map((step, i) => {
        const isCompleted = i <= currentStep;
        const isCurrent = i === currentStep;
        const Icon = isCompleted ? CheckCircle2 : step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <div className={`
                rounded-full p-1.5 transition-all duration-300
                ${isCompleted 
                  ? isCurrent 
                    ? `${step.color} bg-current/10 ring-2 ring-current/30 scale-110` 
                    : `${step.color} opacity-80`
                  : 'text-muted-foreground/40'
                }
              `}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className={`text-[9px] md:text-[10px] mt-1 font-medium whitespace-nowrap ${
                isCompleted ? 'text-foreground' : 'text-muted-foreground/50'
              }`}>
                {step.label}
              </span>
              {dates[i] && (
                <span className="text-[8px] text-muted-foreground">{dates[i]}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded transition-all duration-500 ${
                i < currentStep ? 'bg-primary/60' : 'bg-border'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GiftTimeline;
