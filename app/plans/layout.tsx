import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

const JWT_SECRET = process.env.JWT_SECRET || "peace-driven-default-secret-key"

export default async function PlansLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    if (!token) redirect("/login")

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
        const userId = (payload as any).userId
        if (!userId) redirect("/login")

        await connectDB()
        const user = await User.findById(userId).select("accountStatus role")
        if (!user) redirect("/login")
        if (user.role === "admin") redirect("/admin")
        if (user.accountStatus === "active") redirect("/dashboard")
    } catch (e: any) {
        if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e
        redirect("/login")
    }

    return <>{children}</>
}
