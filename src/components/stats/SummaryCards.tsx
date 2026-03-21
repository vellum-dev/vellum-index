import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WindowStats } from "@/types/stats"

export function SummaryCards({ summary, packagesLabel = "Packages", showPackages = true, loading }: { summary: WindowStats | null; packagesLabel?: string; showPackages?: boolean; loading?: boolean }) {
  const cards = [
    { title: "Total Downloads", hidden: false },
    { title: "Approx Users", hidden: false },
    { title: "Countries", hidden: true },
  ]
  if (showPackages) cards.push({ title: packagesLabel, hidden: false })

  const values: Record<string, string> = summary ? {
    "Total Downloads": summary.total_downloads.toLocaleString(),
    "Approx Users": summary.unique_users.toLocaleString(),
    "Countries": summary.unique_countries.toLocaleString(),
    [packagesLabel]: summary.unique_packages.toLocaleString(),
  } : {}

  return (
    <div className={`grid grid-cols-2 gap-4 ${showPackages ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {cards.map((c) => (
        <Card key={c.title} className={c.hidden ? "hidden lg:flex" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {c.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !summary ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="text-3xl font-bold">{values[c.title]}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
