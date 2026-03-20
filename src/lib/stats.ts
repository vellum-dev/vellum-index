import type { TimeWindow, TimeseriesBucket, GroupedBucket, OverviewPackage } from "@/types/stats"

const DAY = 86400000

export function getFromDate(preset: TimeWindow, firstDownload?: string | null): Date {
  if (preset === "all") {
    return firstDownload ? new Date(firstDownload) : new Date("2020-01-01")
  }
  const days = preset === "24h" ? 1 : preset === "7d" ? 7 : preset === "30d" ? 30 : 90
  return new Date(Date.now() - days * DAY)
}

export function granularityForPreset(preset: TimeWindow): "hourly" | "daily" {
  return preset === "24h" || preset === "7d" ? "hourly" : "daily"
}

export function pickTimeseries(preset: TimeWindow, hourly: TimeseriesBucket[], daily: TimeseriesBucket[]): TimeseriesBucket[] {
  const from = getFromDate(preset)
  const t = from.getTime()
  const source = granularityForPreset(preset) === "hourly" ? hourly : daily
  return source.filter((b) => new Date(b.bucket).getTime() >= t)
}

export function pickGroupedTS(preset: TimeWindow, hourly: GroupedBucket[], daily: GroupedBucket[]): GroupedBucket[] {
  const from = getFromDate(preset)
  const t = from.getTime()
  const source = granularityForPreset(preset) === "hourly" ? hourly : daily
  return source.filter((b) => new Date(b.bucket).getTime() >= t)
}

export function filterPackages(data: OverviewPackage[], preset: TimeWindow): OverviewPackage[] {
  return [...data].sort((a, b) => (b.total_downloads[preset] ?? 0) - (a.total_downloads[preset] ?? 0))
}
