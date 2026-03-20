import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { UAEntry } from "@/types/stats"

export function UserAgentsTable({ data, loading }: { data: UAEntry[]; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top User Agents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Agent</TableHead>
              <TableHead className="text-right">Downloads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              : data.map((row) => (
                  <TableRow key={row.user_agent}>
                    <TableCell className="max-w-xs truncate">{row.user_agent}</TableCell>
                    <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
