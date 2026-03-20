import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CountryEntry } from "@/types/stats"
import { formatCountry } from "@/lib/utils"

export function CountriesTable({ data, loading }: { data: CountryEntry[]; loading?: boolean }) {
  return (
    <Card className="flex flex-1 flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>Top Countries</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Downloads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              : data.map((row) => (
                  <TableRow key={row.country}>
                    <TableCell>{formatCountry(row.country)}</TableCell>
                    <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
