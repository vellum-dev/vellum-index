import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const STATUS_CONFIG: Record<string, { label: string; tooltip: string; variant: 'destructive' | 'secondary' }> = {
  deprecated: {
    label: 'Deprecated',
    tooltip: 'This package will be removed in the future',
    variant: 'destructive',
  },
  unmaintained: {
    label: 'Unmaintained',
    tooltip: 'This package is no longer receiving updates and may not be available on newer OS versions',
    variant: 'secondary',
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={config.variant}>{config.label}</Badge>
        </TooltipTrigger>
        <TooltipContent>{config.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
