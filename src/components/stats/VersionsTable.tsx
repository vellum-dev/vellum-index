import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown } from "lucide-react"
import type { VersionEvent } from "@/types/stats"

type SortKey = "version" | "count"
type SortDir = "asc" | "desc"

function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.-]/).map((s) => (/^\d+$/.test(s) ? parseInt(s, 10) : s))
  const pb = b.split(/[.-]/).map((s) => (/^\d+$/.test(s) ? parseInt(s, 10) : s))
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] ?? 0
    const vb = pb[i] ?? 0
    if (typeof va === "number" && typeof vb === "number") {
      if (va !== vb) return va - vb
    } else {
      const cmp = String(va).localeCompare(String(vb))
      if (cmp !== 0) return cmp
    }
  }
  return 0
}

export function VersionsTable({ data, loading }: { data: VersionEvent[]; loading?: boolean }) {
  const [sortKey, setSortKey] = useState<SortKey>("count")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const versions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of data) {
      counts.set(e.version, (counts.get(e.version) ?? 0) + 1)
    }
    const entries = [...counts.entries()].map(([version, count]) => ({ version, count }))

    entries.sort((a, b) => {
      const cmp = sortKey === "version" ? compareVersions(a.version, b.version) : a.count - b.count
      return sortDir === "asc" ? cmp : -cmp
    })

    return entries
  }, [data, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "count" ? "desc" : "asc")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Downloads by Version</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button className="inline-flex items-center gap-1 cursor-pointer" onClick={() => toggleSort("version")}>
                  Version
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button className="inline-flex items-center gap-1 cursor-pointer ml-auto" onClick={() => toggleSort("count")}>
                  Downloads
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              : versions.map((row) => (
                  <TableRow key={row.version}>
                    <TableCell>{row.version}</TableCell>
                    <TableCell className="text-right">{row.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
