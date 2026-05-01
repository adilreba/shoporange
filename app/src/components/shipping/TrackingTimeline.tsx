/**
 * TrackingTimeline
 * ================
 * Kargo takip durumunu timeline (zaman çizelgesi) olarak gösterir.
 */

import { CheckCircle2, Clock, MapPin, Package, Truck, Home, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrackingEvent {
  operation: string;
  location: string;
  date: string;
  statusCode?: string;
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
  trackingNumber?: string;
  provider?: string;
  className?: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  'Kargo İşleme Alındı': <Package className="h-4 w-4" />,
  'Kargo Yola Çıktı': <Truck className="h-4 w-4" />,
  'Transfer Merkezinde': <MapPin className="h-4 w-4" />,
  'Dağıtıma Çıktı': <Truck className="h-4 w-4" />,
  'Teslim Edildi': <Home className="h-4 w-4" />,
  default: <Clock className="h-4 w-4" />,
};

function getStatusIcon(operation: string) {
  for (const [key, icon] of Object.entries(statusIcons)) {
    if (operation.includes(key)) return icon;
  }
  return statusIcons.default;
}

function isDelivered(operation: string): boolean {
  return operation.toLowerCase().includes('teslim') && operation.toLowerCase().includes('edildi');
}

function isInTransit(operation: string): boolean {
  const transitKeywords = ['yola çıktı', 'transfer', 'dağıtım', 'merkez', 'şube'];
  return transitKeywords.some(k => operation.toLowerCase().includes(k));
}

export function TrackingTimeline({ events, trackingNumber, provider, className }: TrackingTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={cn('text-center py-6 text-muted-foreground', className)}>
        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Takip bilgisi bulunmuyor</p>
        {trackingNumber && (
          <p className="text-xs mt-1 font-mono">{trackingNumber}</p>
        )}
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestEvent = sortedEvents[0];
  const isDeliveredStatus = isDelivered(latestEvent.operation);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Kargo Takibi</h3>
          {trackingNumber && (
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {provider} — {trackingNumber}
            </p>
          )}
        </div>
        <div className={cn(
          'px-2.5 py-1 rounded-full text-xs font-medium',
          isDeliveredStatus
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        )}>
          {isDeliveredStatus ? 'Teslim Edildi' : 'Yolda'}
        </div>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-4">
          {sortedEvents.map((event, index) => {
            const delivered = isDelivered(event.operation);
            const inTransit = isInTransit(event.operation);
            const isLatest = index === 0;

            return (
              <div key={index} className="relative flex gap-3">
                <div className={cn(
                  'absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10',
                  delivered
                    ? 'bg-green-500 border-green-500 text-white'
                    : isLatest
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : inTransit
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-background border-border text-muted-foreground'
                )}>
                  {delivered ? <CheckCircle2 className="h-3.5 w-3.5" /> : getStatusIcon(event.operation)}
                </div>

                <div className={cn(
                  'flex-1 pb-2',
                  index < sortedEvents.length - 1 && 'border-b border-border/50'
                )}>
                  <p className={cn(
                    'text-sm font-medium',
                    isLatest ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {event.operation}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{event.location}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(event.date).toLocaleString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TrackingTimeline;
