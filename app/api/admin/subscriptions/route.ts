import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { requireAdmin } from "@/lib/adminAuth"

export async function GET(req: Request) {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get("page") ?? 1))
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)))
    const search = searchParams.get("search")?.trim() ?? ""
    const status = searchParams.get("status") ?? ""
    const plan = searchParams.get("plan") ?? ""

    await connectDB()

    const query: any = { role: "client" }
    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ]
    }
    if (status) query.accountStatus = status
    if (plan) query.plan = plan

    const total = await User.countDocuments(query)
    const users = await User.find(query)
        .select("firstName lastName email accountStatus plan createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()

    return NextResponse.json({
        subscriptions: users.map((u: any) => ({
            id: u._id.toString(),
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            accountStatus: u.accountStatus,
            plan: u.plan,
            joinedAt: u.createdAt?.toISOString() ?? null,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    })
}
