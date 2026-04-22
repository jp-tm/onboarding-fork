import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { requireAdmin } from "@/lib/adminAuth"

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin()
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { accountStatus } = body

    if (!["unsubscribed", "pending", "active"].includes(accountStatus)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findByIdAndUpdate(
        id,
        { accountStatus },
        { new: true }
    ).select("accountStatus")

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ ok: true, accountStatus: user.accountStatus })
}
