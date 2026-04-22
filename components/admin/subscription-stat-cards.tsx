"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, Zap, Sparkles, MessageSquare } from "lucide-react"

interface PlanBreakdown {
    basic: number
    intermediate: number
    custom: number
}

interface Props {
    activeSubscribers: number | null
    pendingSubscribers: number | null
    planBreakdown: PlanBreakdown | null
    loading?: boolean
}

const PLANS = [
    { key: "basic" as const, label: "Basic", Icon: Zap },
    { key: "intermediate" as const, label: "Intermediate", Icon: Sparkles },
    { key: "custom" as const, label: "Custom", Icon: MessageSquare },
]

function StatCard({
    label,
    value,
    Icon,
    warn,
    href,
}: {
    label: string
    value: number | null
    Icon: React.ElementType
    warn?: boolean
    href?: string
}) {
    const card = (
        <Card
            className={`relative overflow-hidden rounded-2xl border ${warn ? "border-amber-500/20" : "border-[#b6954a]/20"} group bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(182,149,74,0.08)] ${href ? "cursor-pointer" : ""}`}
        >
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/60 uppercase transition-colors group-hover:text-foreground/80">
                        {label}
                    </p>
                    <p
                        className={`mt-2 text-4xl font-extrabold tracking-tight drop-shadow-sm ${warn && value ? "text-amber-500" : "text-foreground"}`}
                    >
                        {value ?? "—"}
                    </p>
                </div>
                <div
                    className={`rounded-xl p-3 shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)] transition-transform duration-300 group-hover:scale-110 ${warn ? "bg-gradient-to-br from-amber-500/15 to-transparent" : "bg-gradient-to-br from-[#b6954a]/15 to-[#b6954a]/5 ring-1 ring-[#b6954a]/10"}`}
                >
                    <Icon
                        className={`h-5 w-5 ${warn ? "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "text-[#b6954a] drop-shadow-[0_0_8px_rgba(182,149,74,0.4)]"}`}
                    />
                </div>
            </div>
            <div
                className="absolute bottom-0 left-0 h-1 w-full opacity-30 transition-opacity duration-300 group-hover:opacity-60"
                style={{
                    backgroundImage: warn
                        ? "linear-gradient(90deg, rgb(245 158 11), transparent)"
                        : "linear-gradient(90deg, #b6954a, transparent)",
                }}
            />
        </Card>
    )

    if (href) return <Link href={href}>{card}</Link>
    return card
}

export function SubscriptionStatCards({
    activeSubscribers,
    pendingSubscribers,
    planBreakdown,
    loading,
}: Props) {
    const total = planBreakdown
        ? Object.values(planBreakdown).reduce((a, b) => a + b, 0)
        : 0

    return (
        <div className="space-y-3">
            <p className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground/40 uppercase">
                Subscriptions
            </p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left: two stat cards stacked */}
                <div className="flex flex-col gap-6">
                    <StatCard
                        label="Active Subscribers"
                        value={activeSubscribers}
                        Icon={CheckCircle2}
                        href="/admin/subscriptions?status=active"
                    />
                    <StatCard
                        label="Pending Activation"
                        value={pendingSubscribers}
                        Icon={Clock}
                        warn={!!pendingSubscribers}
                        href="/admin/subscriptions?status=pending"
                    />
                </div>

                {/* Right: plan breakdown fills remaining height */}
                <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#b6954a]/20 bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <p className="mb-6 font-mono text-[10px] tracking-[0.25em] text-muted-foreground/60 uppercase">
                        Plan Breakdown
                    </p>
                    <div className="flex flex-1 flex-col justify-around gap-6">
                        {PLANS.map(({ key, label, Icon }) => {
                            const count = planBreakdown?.[key] ?? 0
                            const pct =
                                total > 0
                                    ? Math.round((count / total) * 100)
                                    : 0
                            return (
                                <div key={key} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Icon className="h-3 w-3 text-[#b6954a]" />
                                            {label}
                                        </span>
                                        <span className="font-mono text-xs font-bold text-foreground">
                                            {loading ? "—" : count}
                                        </span>
                                    </div>
                                    <div className="h-1 w-full overflow-hidden rounded-full bg-[#b6954a]/10">
                                        <div
                                            className="h-1 rounded-full bg-[#b6954a]/60 transition-all duration-700"
                                            style={{
                                                width: loading
                                                    ? "0%"
                                                    : `${pct}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div
                        className="absolute bottom-0 left-0 h-1 w-full opacity-30"
                        style={{
                            backgroundImage:
                                "linear-gradient(90deg, #b6954a, transparent)",
                        }}
                    />
                </Card>
            </div>
        </div>
    )
}
