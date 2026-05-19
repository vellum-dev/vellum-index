import { TriangleAlert, CirclePause, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; tooltip: string; variant: 'warning' | 'secondary' }> = {
  deprecated: {
    label: 'deprecated',
    icon: TriangleAlert,
    tooltip: 'This package will be removed in the future',
    variant: 'warning',
  },
  unmaintained: {
    label: 'unmaintained',
    icon: CirclePause,
    tooltip: 'This package is no longer receiving updates and may not be available on newer OS versions',
    variant: 'secondary',
  },
};

export function StatusBadge({ status, size }: { status: string; size?: 'sm' | 'default' }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Icon className={`h-4 w-4 align-middle inline-block -ml-1 mr-1.5 -mt-0.5 ${config.variant === 'warning' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
          </TooltipTrigger>
          <TooltipContent>{config.tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="font-light cursor-default mt-0.5">{config.label}</Badge>
        </TooltipTrigger>
        <TooltipContent>{config.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
