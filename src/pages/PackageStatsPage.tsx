import { useState, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePackageStats } from "@/hooks/useStats"
import { SummaryCards } from "@/components/stats/SummaryCards"
import { DownloadsChart } from "@/components/stats/DownloadsChart"
import { CountriesTable } from "@/components/stats/CountriesTable"
import { UserAgentsTable } from "@/components/stats/UserAgentsTable"
import { VersionsTable } from "@/components/stats/VersionsTable"
import { pickTimeseries, pickGroupedTS, granularityForPreset, getFromDate } from "@/lib/stats"
import type { TimeWindow, VersionEvent } from "@/types/stats"

function filterVersionEvents(events: VersionEvent[], preset: TimeWindow): VersionEvent[] {
  const t = getFromDate(preset).getTime()
  return events.filter((e) => new Date(e.ts).getTime() >= t)
}

export function PackageStatsPage() {
  const { name } = useParams<{ name: string }>()
  const { data, loading, error } = usePackageStats(name!)
  const [preset, setPreset] = useState<TimeWindow>(() => {
    const saved = localStorage.getItem("stats-preset")
    return saved && ["24h", "7d", "30d", "90d", "all"].includes(saved) ? saved as TimeWindow : "7d"
  })

  const granularity = granularityForPreset(preset)
  const timeseries = useMemo(() => pickTimeseries(preset, data?.hourly_timeseries ?? [], data?.daily_timeseries ?? []), [preset, data])
  const countriesTS = useMemo(() => pickGroupedTS(preset, data?.hourly_countries_timeseries ?? [], data?.daily_countries_timeseries ?? []), [preset, data])
  const uaTS = useMemo(() => pickGroupedTS(preset, data?.hourly_useragents_timeseries ?? [], data?.daily_useragents_timeseries ?? []), [preset, data])
  const versions = useMemo(() => filterVersionEvents(data?.version_downloads ?? [], preset), [data, preset])

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2">Stats unavailable</h1>
        <p className="text-muted-foreground">
          Download statistics for "{name}" are currently unavailable.
        </p>
        <Link to={`/package/${name}`} className="text-primary hover:underline mt-4 inline-block">
          Back to package details
        </Link>
      </div>
    )
  }

  if (!name) return null

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
            <BreadcrumbLink asChild>
              <Link to={`/package/${name}`}>{name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Stats</BreadcrumbPage>
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

      <SummaryCards summary={data?.windows[preset] ?? null} packagesLabel="Versions" loading={loading} />

      <div className="mt-6">
        <DownloadsChart
          timeseries={timeseries}
          versionEvents={versions}
          countriesTimeseries={countriesTS}
          userAgentsTimeseries={uaTS}
          granularity={granularity}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <VersionsTable data={versions} loading={loading} />
        <div className="relative min-h-[400px]">
          <div className="absolute inset-0 flex flex-col">
            <CountriesTable data={data?.top_countries ?? []} loading={loading} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <UserAgentsTable data={data?.top_user_agents ?? []} loading={loading} />
      </div>

      {data && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Last updated: {new Date(data.generated).toLocaleString()}
        </p>
      )}
    </div>
  )
}
