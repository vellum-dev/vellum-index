import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { FlatPackage } from '@/types/packages';

interface PackageTableProps {
  packages: FlatPackage[];
}

type SortColumn = 'name' | 'upstream_author';
type SortDirection = 'asc' | 'desc';

export function PackageTable({ packages }: PackageTableProps) {
  const [searchParams] = useSearchParams();
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => {
      const aVal = a[sortColumn]?.toLowerCase() ?? '';
      const bVal = b[sortColumn]?.toLowerCase() ?? '';
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [packages, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIndicator = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="inline ml-1 h-4 w-4 text-muted-foreground/50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="inline ml-1 h-4 w-4" />
      : <ArrowDown className="inline ml-1 h-4 w-4" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer hover:text-foreground select-none"
            onClick={() => handleSort('name')}
          >
            Package
            <SortIndicator column="name" />
          </TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead
            className="cursor-pointer hover:text-foreground select-none"
            onClick={() => handleSort('upstream_author')}
          >
            Author
            <SortIndicator column="upstream_author" />
          </TableHead>
          <TableHead className="hidden sm:table-cell md:hidden lg:table-cell">Category</TableHead>
          <TableHead className="hidden lg:table-cell">Version</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedPackages.map((pkg) => (
          <TableRow key={`${pkg.name}-${pkg.version}`}>
            <TableCell>
              <Link
                to={`/package/${pkg.name}${searchParams.size > 0 ? `?${searchParams}` : ''}`}
                className="font-medium text-primary hover:underline"
              >
                {pkg.name}
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell max-w-sm truncate">
              {pkg.pkgdesc}
            </TableCell>
            <TableCell>
              <Link
                to={`/author/${encodeURIComponent(pkg.upstream_author)}`}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {pkg.upstream_author}
              </Link>
            </TableCell>
            <TableCell className="hidden sm:table-cell md:hidden lg:table-cell">
              <div className="flex gap-1 flex-wrap">
                {[...pkg.categories].sort().map((cat) => (
                  <Badge key={cat} variant="outline">{cat}</Badge>
                ))}
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-sm">{pkg.version}</TableCell>
          </TableRow>
        ))}
        {sortedPackages.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No packages found matching your criteria.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
