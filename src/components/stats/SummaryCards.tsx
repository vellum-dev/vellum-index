import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WindowStats } from "@/types/stats"

export function SummaryCards({ summary, packagesLabel = "Packages", showPackages = true, loading }: { summary: WindowStats | null; packagesLabel?: string; showPackages?: boolean; loading?: boolean }) {
  const titles = ["Total Downloads", "Unique Users", "Countries"]
  if (showPackages) titles.push(packagesLabel)
  const cols = showPackages ? "grid-cols-2 gap-4 lg:grid-cols-4" : "grid-cols-3 gap-4"

  if (loading || !summary) {
    return (
      <div className={`grid ${cols}`}>
        {titles.map((title) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    { title: "Total Downloads", value: summary.total_downloads.toLocaleString() },
    { title: "Unique Users", value: summary.unique_users.toLocaleString() },
    { title: "Countries", value: summary.unique_countries.toLocaleString() },
  ]
  if (showPackages) {
    cards.push({ title: packagesLabel, value: summary.unique_packages.toLocaleString() })
  }

  return (
    <div className={`grid ${cols}`}>
      {cards.map((c) => (
        <Card key={c.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {c.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
