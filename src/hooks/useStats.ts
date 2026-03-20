import { useState, useEffect } from 'react'
import type { StatsOverview, PackageStats } from '@/types/stats'

const STATS_BASE = 'https://packages.vellum.delivery/stats'

export function useStatsOverview() {
  const [data, setData] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${STATS_BASE}/stats-overview.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

export function usePackageStats(name: string) {
  const [data, setData] = useState<PackageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${STATS_BASE}/stats-${name}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [name])

  return { data, loading, error }
}
