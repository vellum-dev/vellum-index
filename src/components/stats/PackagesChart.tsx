import { useEffect, useMemo, useState } from "react"
import { Bar, BarChart, BarStack, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, type CustomTooltipProps } from "@/components/ui/chart"
import { Maximize2, Minimize2, Rocket, Blocks } from "lucide-react"
interface PackageEntry {
  name: string
  total: number
  archs: Record<string, number>
  is_framework: boolean
}

export const BOOTSTRAP_PACKAGES = new Set(["vellum", "mount-utils", "vellum-bash-completion"])

const archColorVars: Record<string, string> = {
  aarch64: "var(--foreground)",
  armv7: "var(--muted-foreground)",
  x86_64: "var(--ring)",
  x86: "var(--border)",
}

function colorForArch(arch: string): string {
  return archColorVars[arch] ?? "var(--input)"
}

interface PackagesChartProps {
  data: PackageEntry[]
  selectedPackage?: string | null
  onSelect?: (name: string | null) => void
  loading?: boolean
  expanded?: boolean
  onToggleExpand?: () => void
}

export function PackagesChart({ data, selectedPackage, onSelect, loading, expanded, onToggleExpand }: PackagesChartProps) {
  const [showBootstrap, setShowBootstrap] = useState(() => localStorage.getItem("show-bootstrap") === "true")
  const [showFrameworks, setShowDependencies] = useState(() => localStorage.getItem("show-frameworks") === "true")
  const [isLg, setIsLg] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    setIsLg(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const filteredData = useMemo(() => {
    let filtered = data
    if (!showBootstrap) filtered = filtered.filter((pkg) => !BOOTSTRAP_PACKAGES.has(pkg.name))
    if (!showFrameworks) filtered = filtered.filter((pkg) => !pkg.is_framework)
    return filtered.slice(0, 20)
  }, [data, showBootstrap, showFrameworks])

  const allArchs = useMemo(() => {
    const set = new Set<string>()
    for (const pkg of filteredData) {
      for (const arch of Object.keys(pkg.archs ?? {})) set.add(arch)
    }
    return Array.from(set).sort()
  }, [filteredData])

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    for (const arch of allArchs) {
      config[arch] = { label: arch, color: colorForArch(arch) }
    }
    if (Object.keys(config).length === 0) {
      config.count = { label: "Downloads", color: "var(--color-chart-1)" }
    }
    return config
  }, [allArchs])

  const chartData = filteredData.map((pkg) => {
    const row: Record<string, string | number> = { name: pkg.name }
    for (const arch of allArchs) {
      row[arch] = pkg.archs?.[arch] ?? 0
    }
    return row
  })

  const rowHeight = 36
  const chartHeight = Math.max(200, chartData.length * rowHeight)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Top Packages</CardTitle>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Toggle
                    variant="outline"
                    size="sm"
                    pressed={showBootstrap}
                    onPressedChange={(v) => { setShowBootstrap(v); localStorage.setItem("show-bootstrap", String(v)) }}
                  >
                    <Rocket className="h-4 w-4 group-data-[state=on]/toggle:fill-foreground" />
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>{showBootstrap ? "Hide" : "Show"} bootstrap packages</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Toggle
                    variant="outline"
                    size="sm"
                    pressed={showFrameworks}
                    onPressedChange={(v) => { setShowDependencies(v); localStorage.setItem("show-frameworks", String(v)) }}
                  >
                    <Blocks className="h-4 w-4 group-data-[state=on]/toggle:fill-foreground" />
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>{showFrameworks ? "Hide" : "Show"} frameworks</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {onToggleExpand && (
            <Button variant="ghost" size="icon" className="hidden lg:inline-flex h-8 w-8" onClick={onToggleExpand}>
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 flex-1" style={{ maxWidth: `${90 - i * 8}%` }} />
              </div>
            ))}
          </div>
        ) : (
        <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={isLg && expanded ? 250 : 150}
              tick={(props: any) => {
                const { x, y, payload } = props
                const isSelected = payload.value === selectedPackage
                const maxLen = isLg && expanded ? Infinity : 20
                const label = payload.value.length > maxLen
                  ? `…${payload.value.slice(-maxLen)}`
                  : payload.value
                return (
                  <text
                    x={x}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    fontSize={12}
                    fill={isSelected ? "var(--foreground)" : "var(--muted-foreground)"}
                    fontWeight={isSelected ? 700 : 400}
                    style={{ cursor: onSelect ? "pointer" : "default", outline: "none" }}
                    onClick={() => onSelect?.(isSelected ? null : payload.value)}
                  >
                    {label}
                  </text>
                )
              }}
            />
            <ChartTooltip isAnimationActive={false} content={(props: CustomTooltipProps) => {
              const total = props.payload?.reduce((sum, item) => sum + (Number(item.value) || 0), 0) ?? 0
              return (
                <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                  <div className="font-medium">{props.label}</div>
                  <div className="grid gap-1.5">
                    {props.payload?.map((item) => (
                      <div key={String(item.dataKey)} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
                        <div className="flex flex-1 justify-between leading-none items-center">
                          <span className="text-muted-foreground">{item.name}</span>
                          <span className="text-foreground font-mono font-medium tabular-nums">{Number(item.value).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(props.payload?.length ?? 0) > 1 && (
                    <>
                      <div className="border-t border-border/50" />
                      <div className="flex justify-between leading-none items-center">
                        <span className="text-muted-foreground font-medium">Total</span>
                        <span className="text-foreground font-mono font-medium tabular-nums">{total.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              )
            }} />
            {allArchs.length > 1 && <Legend />}
            <BarStack stackId="arch" radius={[0, 6, 6, 0]}>
              {allArchs.map((arch) => (
                <Bar
                  key={arch}
                  dataKey={arch}
                  fill={`var(--color-${arch})`}
                  isAnimationActive={false}
                />
              ))}
            </BarStack>
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
