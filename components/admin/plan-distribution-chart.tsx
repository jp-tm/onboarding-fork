"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { Zap, Sparkles, MessageSquare } from "lucide-react"

interface PlanBreakdown {
    basic: number
    intermediate: number
    custom: number
}

interface Props {
    data: PlanBreakdown | null
    loading?: boolean
}

const planConfig = {
    subscribers: { label: "Subscribers" },
    basic: { label: "Basic", color: "#f1ddb0" },
    intermediate: { label: "Intermediate", color: "#b6954a" },
    custom: { label: "Custom", color: "#806b38" },
} satisfies ChartConfig

const PLAN_META = [
    { key: "basic" as const, label: "Basic", Icon: Zap },
    { key: "intermediate" as const, label: "Intermediate", Icon: Sparkles },
    { key: "custom" as const, label: "Custom", Icon: MessageSquare },
]

export function PlanDistributionChart({ data, loading }: Props) {
    const chartData = PLAN_META.map((p) => ({
        plan: p.label,
        key: p.key,
        subscribers: data?.[p.key] ?? 0,
        fill: `var(--color-${p.key})`,
    }))

    const total = React.useMemo(
        () => chartData.reduce((acc, d) => acc + d.subscribers, 0),
        [chartData]
    )

    return (
        <Card className="rounded-2xl border border-[#b6954a]/15 bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#b6954a]/50" />
                    <CardTitle className="font-mono text-[10px] font-normal tracking-[0.25em] text-muted-foreground/60 uppercase">
                        Plan Distribution
                    </CardTitle>
                </div>
                <CardDescription className="mt-1.5 text-xs text-muted-foreground/70">
                    Breakdown of active subscribers by plan tier.
                </CardDescription>
            </CardHeader>

            <CardContent className="relative flex-1 pt-4 pb-0">
                {loading ? (
                    <div className="absolute inset-0 flex animate-pulse items-center justify-center font-mono text-sm tracking-widest text-[#b6954a]/50 uppercase">
                        Loading…
                    </div>
                ) : total === 0 ? (
                    <div className="flex h-[200px] items-center justify-center font-mono text-sm tracking-widest text-muted-foreground/30 uppercase">
                        No data
                    </div>
                ) : (
                    <ChartContainer
                        config={planConfig}
                        className="mx-auto aspect-square max-h-[220px]"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie
                                data={chartData}
                                dataKey="subscribers"
                                nameKey="plan"
                                innerRadius={60}
                                strokeWidth={4}
                                stroke="var(--background)"
                                style={{
                                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.1))",
                                }}
                            >
                                <Label
                                    content={({ viewBox }) => {
                                        if (
                                            viewBox &&
                                            "cx" in viewBox &&
                                            "cy" in viewBox
                                        ) {
                                            return (
                                                <text
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        className="fill-foreground text-4xl font-extrabold tracking-tighter drop-shadow-sm"
                                                    >
                                                        {total}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={(viewBox.cy || 0) + 24}
                                                        className="fill-muted-foreground text-xs font-semibold tracking-wider uppercase"
                                                    >
                                                        Plans
                                                    </tspan>
                                                </text>
                                            )
                                        }
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>

            <CardFooter className="flex-wrap justify-center gap-x-5 gap-y-2 pb-6 pt-6">
                {PLAN_META.map(({ key, label, Icon }) => (
                    <span
                        key={key}
                        className="flex items-center gap-2 text-xs font-medium text-muted-foreground/90 transition-colors hover:text-foreground"
                    >
                        <span
                            className="inline-block h-2.5 w-2.5 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]"
                            style={{
                                background: (
                                    planConfig as Record<
                                        string,
                                        { color?: string }
                                    >
                                )[key]?.color,
                            }}
                        />
                        <Icon className="h-3 w-3" />
                        {label}
                        <span className="ml-0.5 font-bold text-foreground/80">
                            {data?.[key] ?? 0}
                        </span>
                    </span>
                ))}
            </CardFooter>
        </Card>
    )
}
