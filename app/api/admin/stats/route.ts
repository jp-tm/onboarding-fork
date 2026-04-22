import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import OnboardingProfile from "@/models/OnboardingProfile"
import { requireAdmin } from "@/lib/adminAuth"
import { withCache } from "@/lib/redis"

const STEPS = [
    "1A",
    "1B",
    "1C",
    "1D",
    "1E",
    "1F",
    "2A",
    "2B",
    "2C",
    "3A",
    "3B",
    "3C",
    "3D",
    "3E",
    "4A",
    "4B",
    "4C",
]
const STALE_DAYS = 7

export async function GET() {
    const admin = await requireAdmin()
    if (!admin)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()

    const stats = await withCache("admin:stats", 300, async () => {
        const now = new Date()
        const staleThreshold = new Date(
            now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000
        )
        const eightWeeksAgo = new Date(
            now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000
        )

        const [
            totalClients,
            profiles,
            registrationTrend,
            completionTrend,
            activeSubscribers,
            pendingSubscribers,
            planAgg,
        ] = await Promise.all([
                User.countDocuments({ role: "client" }),
                OnboardingProfile.find({}).select("status").lean(),
                User.aggregate([
                    {
                        $match: {
                            role: "client",
                            createdAt: { $gte: eightWeeksAgo },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: "%Y-%m-%d",
                                    date: {
                                        $dateTrunc: {
                                            date: "$createdAt",
                                            unit: "week",
                                        },
                                    },
                                },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ]),
                OnboardingProfile.aggregate([
                    {
                        $match: {
                            "status.isCompleted": true,
                            "status.updatedAt": { $gte: eightWeeksAgo },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: "%Y-%m-%d",
                                    date: {
                                        $dateTrunc: {
                                            date: "$status.updatedAt",
                                            unit: "week",
                                        },
                                    },
                                },
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { _id: 1 } },
                ]),
                User.countDocuments({ role: "client", accountStatus: "active" }),
                User.countDocuments({ role: "client", accountStatus: "pending" }),
                User.aggregate([
                    { $match: { role: "client", plan: { $ne: null } } },
                    { $group: { _id: "$plan", count: { $sum: 1 } } },
                ]),
            ])

        const completed = profiles.filter((p) => p.status.isCompleted).length
        const inProgress = profiles.filter((p) => !p.status.isCompleted).length
        const stale = profiles.filter(
            (p) =>
                !p.status.isCompleted &&
                p.status.updatedAt &&
                new Date(p.status.updatedAt) < staleThreshold
        ).length

        const phaseCounts: Record<string, number> = {
            "1": 0,
            "2": 0,
            "3": 0,
            "4": 0,
            completed: 0,
        }
        profiles.forEach((p) => {
            if (p.status.isCompleted) phaseCounts.completed++
            else phaseCounts[String(p.status.currentPhase)]++
        })

        const phaseDistribution = [
            { phase: "Connection", count: phaseCounts["1"] },
            { phase: "Awareness", count: phaseCounts["2"] },
            { phase: "Stabilization", count: phaseCounts["3"] },
            { phase: "Activation", count: phaseCounts["4"] },
            { phase: "Completed", count: phaseCounts.completed },
        ]

        const stepFunnel = STEPS.map((step) => {
            const stepIdx = STEPS.indexOf(step)
            const count = profiles.filter((p) => {
                if (p.status.isCompleted) return true
                const userStepIdx = STEPS.indexOf(p.status.currentStep)
                return userStepIdx >= stepIdx
            }).length
            return { step, count }
        })

        const planBreakdown = { basic: 0, intermediate: 0, custom: 0 }
        for (const p of planAgg) {
            if (p._id in planBreakdown)
                planBreakdown[p._id as keyof typeof planBreakdown] = p.count
        }

        return {
            totalClients,
            inProgress,
            completed,
            stale,
            phaseDistribution,
            stepFunnel,
            activeSubscribers,
            pendingSubscribers,
            planBreakdown,
            registrationTrend: registrationTrend.map((r) => ({
                week: r._id,
                count: r.count,
            })),
            completionTrend: completionTrend.map((r) => ({
                week: r._id,
                count: r.count,
            })),
        }
    })

    return NextResponse.json(stats)
}
