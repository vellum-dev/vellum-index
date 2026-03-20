export interface WindowStats {
  total_downloads: number
  unique_users: number
  unique_countries: number
  unique_packages: number
}

export interface OverviewPackage {
  name: string
  total: number
  total_downloads: Record<string, number>
  archs: Record<string, number>
  is_bootstrap: boolean
  is_framework: boolean
}

export interface GroupedBucket {
  bucket: string
  key: string
  count: number
}

export interface StatsOverview {
  generated: string
  windows: Record<string, WindowStats>
  packages: OverviewPackage[]
  hourly_timeseries: TimeseriesBucket[]
  daily_timeseries: TimeseriesBucket[]
  hourly_countries_timeseries: GroupedBucket[]
  daily_countries_timeseries: GroupedBucket[]
  hourly_useragents_timeseries: GroupedBucket[]
  daily_useragents_timeseries: GroupedBucket[]
  top_countries: CountryEntry[]
  top_user_agents: UAEntry[]
}

export interface CountryEntry {
  country: string
  count: number
}

export interface UAEntry {
  user_agent: string
  count: number
}

export interface TimeseriesBucket {
  bucket: string
  count: number
}

export interface VersionEvent {
  ts: string
  version: string
}

export interface PackageStats {
  generated: string
  name: string
  windows: Record<string, WindowStats>
  top_countries: CountryEntry[]
  top_user_agents: UAEntry[]
  architecture_breakdown: Record<string, number>
  hourly_timeseries: TimeseriesBucket[]
  daily_timeseries: TimeseriesBucket[]
  hourly_countries_timeseries: GroupedBucket[]
  daily_countries_timeseries: GroupedBucket[]
  hourly_useragents_timeseries: GroupedBucket[]
  daily_useragents_timeseries: GroupedBucket[]
  version_downloads: VersionEvent[]
}

export type TimeWindow = "24h" | "7d" | "30d" | "90d" | "all"
