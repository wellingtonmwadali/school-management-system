import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string; positive?: boolean };
  className?: string;
}

export function StatsCard({ title, value, subtitle, icon: Icon, iconColor = 'text-primary', trend, className }: StatsCardProps) {
  return (
    <Card className={cn('animate-fade-in', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p className={cn('mt-2 text-xs font-medium', trend.positive ? 'text-green-600' : 'text-red-600')}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn('rounded-full p-3 bg-primary/10', iconColor)}>
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
