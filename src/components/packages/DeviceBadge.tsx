import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Device } from '@/types/packages';

const deviceInfo: Record<Device, { label: string; description: string }> = {
  rm1: { label: 'RM1', description: 'reMarkable 1' },
  rm2: { label: 'RM2', description: 'reMarkable 2' },
  rmpp: { label: 'RMPP', description: 'reMarkable Paper Pro' },
  rmppm: { label: 'RMPPM', description: 'reMarkable Paper Pro Move' },
};

interface DeviceBadgeProps {
  device: Device;
}

export function DeviceBadge({ device }: DeviceBadgeProps) {
  const info = deviceInfo[device];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline">{info.label}</Badge>
        </TooltipTrigger>
        <TooltipContent>{info.description}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
