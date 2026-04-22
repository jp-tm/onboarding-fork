import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

const JWT_SECRET = process.env.JWT_SECRET || "peace-driven-default-secret-key"

const VALID_PLANS = ["basic", "intermediate", "custom"] as const
type Plan = (typeof VALID_PLANS)[number]

export async function POST(req: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let userId: string
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
        userId = (payload as any).userId
        if (!userId) throw new Error()
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const plan = body.plan as Plan
    if (!VALID_PLANS.includes(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    await connectDB()
    await User.findByIdAndUpdate(userId, { plan, accountStatus: "pending" })

    return NextResponse.json({ ok: true })
}
