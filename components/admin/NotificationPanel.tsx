"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Clock,
    UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NotificationType =
    | "new_signup"
    | "pending_approval"
    | "stale_client"
    | "onboarding_complete"

type NotificationPriority = "high" | "medium" | "info"

interface AdminNotification {
    id: string
    type: NotificationType
    priority: NotificationPriority
    message: string
    clientName: string
    clientId: string
    timestamp: string
    href: string
}

const LAST_SEEN_KEY = "admin:notif:lastSeen"
const POLL_MS = 60_000

const TYPE_CONFIG: Record<
    NotificationType,
    {
        icon: React.FC<{ className?: string }>
        label: string
        color: string
    }
> = {
    new_signup: {
        icon: UserPlus,
        label: "New Signup",
        color: "text-blue-400",
    },
    pending_approval: {
        icon: AlertTriangle,
        label: "Pending Approval",
        color: "text-amber-400",
    },
    stale_client: {
        icon: Clock,
        label: "Stale Client",
        color: "text-orange-400",
    },
    onboarding_complete: {
        icon: CheckCircle2,
        label: "Completed",
        color: "text-green-400",
    },
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
}

export function NotificationPanel() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<AdminNotification[]>([])
    const [lastSeen, setLastSeen] = useState<string | null>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setLastSeen(localStorage.getItem(LAST_SEEN_KEY))
    }, [])

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/notifications")
            if (!res.ok) return
            const data = await res.json()
            setNotifications(data.notifications ?? [])
        } catch {}
    }, [])

    useEffect(() => {
        fetchNotifications()
        const id = setInterval(fetchNotifications, POLL_MS)
        return () => clearInterval(id)
    }, [fetchNotifications])

    useEffect(() => {
        if (!open) return
        function onMouseDown(e: MouseEvent) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target as Node)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", onMouseDown)
        return () => document.removeEventListener("mousedown", onMouseDown)
    }, [open])

    const unreadCount = notifications.filter(
        (n) => !lastSeen || new Date(n.timestamp) > new Date(lastSeen)
    ).length

    function markAllRead() {
        const now = new Date().toISOString()
        localStorage.setItem(LAST_SEEN_KEY, now)
        setLastSeen(now)
    }

    function handleClick(n: AdminNotification) {
        setOpen(false)
        router.push(n.href)
    }

    return (
        <div ref={panelRef} className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen((v) => !v)}
                className="relative h-9 w-9 rounded-full text-muted-foreground transition-colors hover:bg-[#b6954a]/10 hover:text-[#b6954a]"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Button>

            {open && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-[#b6954a]/20 bg-background shadow-2xl shadow-black/30">
                    <div className="flex items-center justify-between border-b border-[#b6954a]/10 px-4 py-3">
                        <span className="text-sm font-semibold tracking-wide">
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs text-[#b6954a] transition-opacity hover:opacity-70"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                                <Bell className="h-8 w-8 opacity-20" />
                                <p className="text-xs">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const { icon: Icon, color } = TYPE_CONFIG[n.type]
                                const isUnread =
                                    !lastSeen ||
                                    new Date(n.timestamp) > new Date(lastSeen)
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleClick(n)}
                                        className={cn(
                                            "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#b6954a]/5",
                                            isUnread && "bg-[#b6954a]/[0.04]"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "mt-0.5 shrink-0",
                                                color
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="truncate text-sm font-medium leading-snug">
                                                    {n.clientName}
                                                </p>
                                                {isUnread && (
                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b6954a]" />
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {n.message}
                                            </p>
                                            <p className="mt-1 text-[10px] text-muted-foreground/60">
                                                {relativeTime(n.timestamp)}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="border-t border-[#b6954a]/10 px-4 py-2.5">
                            <button
                                onClick={() => {
                                    setOpen(false)
                                    router.push("/admin/clients")
                                }}
                                className="text-xs text-[#b6954a] transition-opacity hover:opacity-70"
                            >
                                View all clients →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
