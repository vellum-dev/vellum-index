import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterState {
  search: string;
  category: string;
  device: string;
  osVersion: string;
}

interface PackageFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  categories: string[];
  devices: string[];
  osVersions: string[];
}

export function PackageFilters({
  filters,
  onFilterChange,
  categories,
  devices,
  osVersions,
}: PackageFiltersProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] gap-4 mb-6">
      <div className="relative">
        <Input
          placeholder="Search packages..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange('search', '')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Select
        value={filters.category}
        onValueChange={(value) => onFilterChange('category', value)}
      >
        <SelectTrigger className="w-full lg:w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.device}
        onValueChange={(value) => onFilterChange('device', value)}
      >
        <SelectTrigger className="w-full lg:w-40">
          <SelectValue placeholder="Device" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Devices</SelectItem>
          {devices.map((dev) => (
            <SelectItem key={dev} value={dev}>
              {dev.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.osVersion}
        onValueChange={(value) => onFilterChange('osVersion', value)}
      >
        <SelectTrigger className="w-full lg:w-40">
          <SelectValue placeholder="OS Version" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Latest Packages</SelectItem>
          {osVersions.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
