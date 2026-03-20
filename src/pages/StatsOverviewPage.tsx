import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useStatsOverview } from "@/hooks/useStats"
import { SummaryCards } from "@/components/stats/SummaryCards"
import { DownloadsChart } from "@/components/stats/DownloadsChart"
import { PackagesChart } from "@/components/stats/PackagesChart"
import { CountriesTable } from "@/components/stats/CountriesTable"
import { UserAgentsTable } from "@/components/stats/UserAgentsTable"
import { pickTimeseries, pickGroupedTS, granularityForPreset, filterPackages } from "@/lib/stats"
import type { TimeWindow } from "@/types/stats"

export function StatsOverviewPage() {
  const { data, loading, error } = useStatsOverview()
  const [preset, setPreset] = useState<TimeWindow>(() => {
    const saved = localStorage.getItem("stats-preset")
    return saved && ["24h", "7d", "30d", "90d", "all"].includes(saved) ? saved as TimeWindow : "7d"
  })
  const [packagesExpanded, setPackagesExpanded] = useState(false)

  const granularity = granularityForPreset(preset)
  const timeseries = useMemo(() => pickTimeseries(preset, data?.hourly_timeseries ?? [], data?.daily_timeseries ?? []), [preset, data])
  const countriesTS = useMemo(() => pickGroupedTS(preset, data?.hourly_countries_timeseries ?? [], data?.daily_countries_timeseries ?? []), [preset, data])
  const uaTS = useMemo(() => pickGroupedTS(preset, data?.hourly_useragents_timeseries ?? [], data?.daily_useragents_timeseries ?? []), [preset, data])
  const packages = useMemo(() => filterPackages(data?.packages ?? [], preset), [data, preset])

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Stats unavailable</h1>
        <p className="text-muted-foreground">Download statistics are currently unavailable.</p>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Packages</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Statistics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6 flex items-center gap-2">
        {(["24h", "7d", "30d", "90d", "all"] as TimeWindow[]).map((p) => (
          <Button
            key={p}
            variant={preset === p ? "default" : "outline"}
            size="sm"
            className={`min-w-[3.5rem] ${preset === p ? "border border-primary" : ""}`}
            onClick={() => { localStorage.setItem("stats-preset", p); setPreset(p) }}
          >
            {p}
          </Button>
        ))}
      </div>

      <SummaryCards summary={data?.windows[preset] ?? null} showPackages={false} loading={loading} />

      <div className="mt-6">
        <DownloadsChart
          timeseries={timeseries}
          countriesTimeseries={countriesTS}
          userAgentsTimeseries={uaTS}
          granularity={granularity}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className={`order-1 min-w-0 flex flex-col ${packagesExpanded ? "lg:col-span-2" : ""}`}>
          <PackagesChart
            data={packages}
            loading={loading}
            expanded={packagesExpanded}
            onToggleExpand={() => setPackagesExpanded((v) => !v)}
          />
        </div>
        <div className="order-3 lg:order-2 relative min-h-[400px]">
          <div className="absolute inset-0 flex flex-col">
            <CountriesTable data={data?.top_countries ?? []} loading={loading} />
          </div>
        </div>
        {packagesExpanded && (
          <div className="order-4 min-w-0 flex flex-col [&>*]:flex-1">
            <UserAgentsTable data={data?.top_user_agents ?? []} loading={loading} />
          </div>
        )}
      </div>

      {!packagesExpanded && (
        <div className="mt-6">
          <UserAgentsTable data={data?.top_user_agents ?? []} loading={loading} />
        </div>
      )}

      {data && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Last updated: {new Date(data.generated).toLocaleString()}
        </p>
      )}
    </div>
  )
}
