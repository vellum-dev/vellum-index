import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEVICE_LABELS, type Device } from '@/types/packages';

const deviceDescriptions: Record<Device, string> = {
  rm1: 'reMarkable 1',
  rm2: 'reMarkable 2',
  rmpp: 'reMarkable Paper Pro',
  rmppmove: 'reMarkable Paper Pro Move',
  rmppure: 'reMarkable Paper Pure',
};

interface DeviceBadgeProps {
  device: Device;
}

export function DeviceBadge({ device }: DeviceBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline">{DEVICE_LABELS[device]}</Badge>
        </TooltipTrigger>
        <TooltipContent>{deviceDescriptions[device]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
