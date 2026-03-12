import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatWidgetProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

const StatWidget: React.FC<StatWidgetProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'bg-primary/10 text-primary',
}) => {
  const changeColors = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className="animate-fade-in">
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${changeColors[changeType]}`}>
              {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''} {change}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatWidget;
