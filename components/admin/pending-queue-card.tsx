"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, ArrowRight, Ban, Zap, Sparkles, MessageSquare } from "lucide-react"

interface PendingUser {
    id: string
    firstName: string
    lastName: string
    email: string
    plan: string | null
    joinedAt: string | null
}

const PLAN_META: Record<string, { label: string; Icon: React.ElementType }> = {
    basic: { label: "Basic", Icon: Zap },
    intermediate: { label: "Intermediate", Icon: Sparkles },
    custom: { label: "Custom", Icon: MessageSquare },
}

function SkeletonRow() {
    return (
        <div className="flex items-center gap-3 px-6 py-4">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-amber-500/10" />
            <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 animate-pulse rounded bg-amber-500/10" />
                <div className="h-2.5 w-44 animate-pulse rounded bg-amber-500/5" />
            </div>
            <div className="h-7 w-20 animate-pulse rounded-lg bg-amber-500/10" />
        </div>
    )
}

export function PendingQueueCard() {
    const [users, setUsers] = useState<PendingUser[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [acting, setActing] = useState<string | null>(null)

    const fetchPending = useCallback(() => {
        setLoading(true)
        fetch("/api/admin/subscriptions?status=pending&limit=5")
            .then((r) => r.json())
            .then((data) => {
                setUsers(data.subscriptions ?? [])
                setTotal(data.pagination?.total ?? 0)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    useEffect(() => {
        fetchPending()
    }, [fetchPending])

    async function patchStatus(id: string, accountStatus: string) {
        setActing(id)
        try {
            await fetch(`/api/admin/subscriptions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountStatus }),
            })
            fetchPending()
        } finally {
            setActing(null)
        }
    }

    function formatDate(iso: string | null) {
        if (!iso) return "—"
        return new Date(iso).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })
    }

    return (
        <Card className="overflow-hidden rounded-2xl border border-amber-500/20 bg-card shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-amber-500/10 bg-amber-500/[0.03] px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
                        <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            Pending Activation
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground/50">
                            {loading ? "…" : `${total} awaiting review`}
                        </p>
                    </div>
                </div>
                <Link href="/admin/subscriptions?status=pending">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
                    >
                        View all
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </Link>
            </div>

            {/* Rows */}
            <div className="divide-y divide-amber-500/10">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonRow key={i} />
                    ))
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
                        <p className="text-sm text-muted-foreground">
                            No pending activations
                        </p>
                    </div>
                ) : (
                    users.map((user) => {
                        const plan = user.plan ? PLAN_META[user.plan] : null
                        const busy = acting === user.id

                        return (
                            <div
                                key={user.id}
                                className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-amber-500/[0.02]"
                            >
                                {/* Avatar */}
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-bold uppercase text-amber-600 ring-1 ring-amber-500/20">
                                    {user.firstName[0]}
                                    {user.lastName[0]}
                                </div>

                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                                        {user.firstName} {user.lastName}
                                        {plan && (
                                            <span className="flex items-center gap-1 rounded-full border border-[#b6954a]/20 bg-[#b6954a]/5 px-1.5 py-0.5 font-mono text-[9px] text-[#b6954a]">
                                                <plan.Icon className="h-2.5 w-2.5" />
                                                {plan.label}
                                            </span>
                                        )}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Date */}
                                <span className="shrink-0 font-mono text-[10px] text-muted-foreground/40">
                                    {formatDate(user.joinedAt)}
                                </span>

                                {/* Actions */}
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={busy}
                                        onClick={() =>
                                            patchStatus(user.id, "active")
                                        }
                                        className="h-7 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-50"
                                    >
                                        {busy ? "…" : "Activate"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={busy}
                                        onClick={() =>
                                            patchStatus(
                                                user.id,
                                                "unsubscribed"
                                            )
                                        }
                                        className="h-7 w-7 rounded-lg border border-border/50 p-0 text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground disabled:opacity-50"
                                        title="Dismiss"
                                    >
                                        <Ban className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Footer — only show when there are more than 5 */}
            {!loading && total > 5 && (
                <div className="border-t border-amber-500/10 bg-amber-500/[0.02] px-6 py-3 text-center">
                    <Link
                        href="/admin/subscriptions?status=pending"
                        className="font-mono text-[10px] tracking-widest text-amber-500/70 uppercase transition-colors hover:text-amber-500"
                    >
                        +{total - 5} more pending →
                    </Link>
                </div>
            )}
        </Card>
    )
}
