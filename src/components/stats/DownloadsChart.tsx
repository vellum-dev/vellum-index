import { useEffect, useMemo, useState } from "react"
import { useDelayedLoading } from "@/hooks/useDelayedLoading"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Globe, Monitor, GitBranch } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent, InteractiveChartLegend } from "@/components/ui/chart"
import type { TimeseriesBucket, VersionEvent, GroupedBucket } from "@/types/stats"

type ChartMode = "downloads" | "versions" | "countries" | "useragents"

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
]

const monochromeColors = [
  "var(--foreground)",
  "var(--muted-foreground)",
  "var(--ring)",
  "var(--border)",
  "var(--input)",
]

const downloadsConfig = {
  count: {
    label: "Downloads",
    color: "var(--color-chart-1)",
  },
}

const DAY = 86400000

interface StackedDataResult {
  data: Record<string, string | number>[]
  groups: string[]
}

function bucketVersionEvents(events: VersionEvent[], granularity: string, from: string): StackedDataResult {
  if (events.length === 0) return { data: [], groups: [] }

  const versions = Array.from(new Set(events.map((e) => e.version)))
    .sort((a, b) => compareSemver(b, a))

  function compareSemver(a: string, b: string): number {
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
  const interval = granularity === "hourly" ? DAY / 24 : granularity === "weekly" ? 7 * DAY : DAY

  const buckets = new Map<number, Map<string, number>>()
  for (const e of events) {
    const t = new Date(e.ts).getTime()
    const key = Math.floor(t / interval) * interval
    if (!buckets.has(key)) buckets.set(key, new Map())
    const vMap = buckets.get(key)!
    vMap.set(e.version, (vMap.get(e.version) ?? 0) + 1)
  }

  const startKey = Math.floor(new Date(from).getTime() / interval) * interval
  const endKey = Math.floor(Date.now() / interval) * interval
  const data: Record<string, string | number>[] = []
  for (let k = startKey; k <= endKey; k += interval) {
    const row: Record<string, string | number> = { bucket: new Date(k).toISOString() }
    const vMap = buckets.get(k)
    for (const v of versions) row[v] = vMap?.get(v) ?? 0
    data.push(row)
  }

  return { data, groups: versions }
}

function pivotGroupedBuckets(series: GroupedBucket[], granularity: string, from: string): StackedDataResult {
  if (series.length === 0) return { data: [], groups: [] }

  const bucketMap = new Map<number, Record<string, number>>()
  const groupTotals = new Map<string, number>()

  for (const row of series) {
    const bucket = new Date(row.bucket).getTime()
    const group = row.key
    const count = row.count

    if (!bucketMap.has(bucket)) bucketMap.set(bucket, {})
    const b = bucketMap.get(bucket)!
    b[group] = (b[group] ?? 0) + count
    groupTotals.set(group, (groupTotals.get(group) ?? 0) + count)
  }

  const sortedGroups = [...groupTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)

  const otherIdx = sortedGroups.indexOf("Other")
  const groups = otherIdx >= 0
    ? [...sortedGroups.filter((g) => g !== "Other"), "Other"]
    : sortedGroups

  const interval = granularity === "hourly" ? DAY / 24 : granularity === "weekly" ? 7 * DAY : DAY
  const firstKey = Math.floor(new Date(from).getTime() / interval) * interval
  const endKey = Math.floor(Date.now() / interval) * interval

  const data: Record<string, string | number>[] = []
  for (let k = firstKey; k <= endKey; k += interval) {
    const counts = bucketMap.get(k)
    const row: Record<string, string | number> = { bucket: new Date(k).toISOString() }
    for (const g of groups) row[g] = counts?.[g] ?? 0
    data.push(row)
  }

  return { data, groups }
}

interface DownloadsChartProps {
  timeseries: TimeseriesBucket[]
  versionEvents?: VersionEvent[]
  countriesTimeseries?: GroupedBucket[]
  userAgentsTimeseries?: GroupedBucket[]
  granularity?: "hourly" | "daily" | "weekly"
  loading?: boolean
}

const MODE_LABELS: Record<ChartMode, string> = {
  downloads: "Downloads",
  versions: "Versions",
  countries: "Countries",
  useragents: "User Agents",
}

const MODE_ICONS: Record<ChartMode, typeof Download> = {
  downloads: Download,
  versions: GitBranch,
  countries: Globe,
  useragents: Monitor,
}

export function DownloadsChart({ timeseries, versionEvents, countriesTimeseries, userAgentsTimeseries, granularity: granularityProp, loading }: DownloadsChartProps) {
  const isPackageView = !!versionEvents
  const modes: [ChartMode, string][] = isPackageView
    ? [["downloads", "Downloads"], ["versions", "Versions"], ["countries", "Countries"], ["useragents", "User Agents"]]
    : [["downloads", "Downloads"], ["countries", "Countries"], ["useragents", "User Agents"]]

  const [mode, setMode] = useState<ChartMode>(() => {
    const saved = localStorage.getItem("chart-mode")
    if (saved && modes.some(([m]) => m === saved)) return saved as ChartMode
    return modes[0][0]
  })
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  useEffect(() => {
    setActiveGroup(null)
    localStorage.setItem("chart-mode", mode)
  }, [mode])

  const granularity = granularityProp ?? "daily"

  const from = useMemo(() => {
    if (timeseries.length > 0) return timeseries[0].bucket
    return new Date(Date.now() - 90 * DAY).toISOString()
  }, [timeseries])

  const groupedData = useMemo<StackedDataResult | null>(() => {
    if (mode === "downloads") return null
    if (mode === "versions" && versionEvents?.length) {
      return bucketVersionEvents(versionEvents, granularity, from)
    }
    if (mode === "countries" && countriesTimeseries?.length) {
      return pivotGroupedBuckets(countriesTimeseries, granularity, from)
    }
    if (mode === "useragents" && userAgentsTimeseries?.length) {
      return pivotGroupedBuckets(userAgentsTimeseries, granularity, from)
    }
    return { data: [], groups: [] }
  }, [mode, versionEvents, countriesTimeseries, userAgentsTimeseries, granularity, from])

  const formatTick = (iso: string) => {
    const d = new Date(iso)
    if (granularity === "hourly") {
      return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric" })
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  }

  const formatTooltipLabel = (label: any) => {
    const d = new Date(String(label))
    if (granularity === "hourly") {
      return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    }
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
  }

  const isLoading = !!loading
  const showSkeleton = useDelayedLoading(isLoading)

  const stackedConfig = useMemo(() => {
    if (!groupedData) return {}
    const colors = mode === "versions" ? monochromeColors : CHART_COLORS
    const cfg: Record<string, { label: string; color: string }> = {}
    groupedData.groups.forEach((g, i) => {
      cfg[g] = { label: g, color: colors[i % colors.length] }
    })
    return cfg
  }, [groupedData, mode])

  const stackedColors = mode === "versions" ? monochromeColors : CHART_COLORS

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {MODE_LABELS[mode]} Over Time
        </CardTitle>
        <div className="flex gap-1">
          {modes.map(([m, label]) => {
            const Icon = MODE_ICONS[m]
            return (
              <Button
                key={m}
                variant={mode === m ? "default" : "outline"}
                size="sm"
                className={`sm:min-w-[5.5rem] ${mode === m ? "border border-primary" : ""}`}
                onClick={() => setMode(m)}
              >
                <Icon className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          showSkeleton ? <Skeleton className="h-[300px] w-full" /> : <div className="h-[300px]" />
        ) : mode === "downloads" ? (
          <ChartContainer config={downloadsConfig} className="h-[300px] w-full">
            <AreaChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" tickFormatter={formatTick} />
              <YAxis />
              <ChartTooltip
                isAnimationActive={false}
                content={(props: any) => <ChartTooltipContent {...props} />}
                labelFormatter={formatTooltipLabel}
              />
              <Area
                type="monotone"
                dataKey="count"
                fill="var(--color-chart-1)"
                fillOpacity={0.2}
                stroke="var(--color-chart-1)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        ) : groupedData && groupedData.data.length > 0 ? (
          <>
          <ChartContainer config={stackedConfig} className="h-[300px] w-full">
            <AreaChart data={groupedData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" tickFormatter={formatTick} />
              <YAxis />
              <ChartTooltip
                isAnimationActive={false}
                content={(props: any) => <ChartTooltipContent {...props} />}
                labelFormatter={formatTooltipLabel}
              />
              {groupedData.groups.map((group, i) => {
                const defaultColor = stackedColors[i % stackedColors.length]
                const fill = !activeGroup ? defaultColor : activeGroup === group ? "var(--foreground)" : "var(--border)"
                const stroke = !activeGroup ? defaultColor : activeGroup === group ? "var(--foreground)" : "var(--border)"
                return (
                <Area
                  key={group}
                  type="monotone"
                  dataKey={group}
                  fill={fill}
                  fillOpacity={0.3}
                  stroke={stroke}
                  isAnimationActive={false}
                />
                )
              })}
            </AreaChart>
          </ChartContainer>
          <InteractiveChartLegend
            groups={groupedData.groups}
            colors={groupedData.groups.map((_, i) => stackedColors[i % stackedColors.length])}
            activeGroup={activeGroup}
            onToggle={(g) => setActiveGroup(activeGroup === g ? null : g)}
          />
          </>
        ) : groupedData ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">No data</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
