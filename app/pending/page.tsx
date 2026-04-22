import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import Link from "next/link"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { ModeToggle } from "@/components/mode-toggle"
import { Clock, CheckCircle2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

const JWT_SECRET = process.env.JWT_SECRET || "peace-driven-default-secret-key"

const PLAN_LABELS: Record<string, string> = {
    basic: "Basic",
    intermediate: "Intermediate",
    custom: "Custom",
}

export default async function PendingPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value
    if (!token) redirect("/login")

    let userId: string
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
        userId = (payload as any).userId
        if (!userId) throw new Error()
    } catch {
        redirect("/login")
    }

    await connectDB()
    const user = await User.findById(userId).select("firstName accountStatus plan")
    if (!user) redirect("/login")

    if (user.accountStatus === "active") redirect("/dashboard")
    if (user.accountStatus === "unsubscribed") redirect("/plans")

    const isCustom = user.plan === "custom"
    const planLabel = user.plan ? PLAN_LABELS[user.plan] : "Selected"

    return (
        <div className="relative min-h-svh w-full bg-background">
            <div className="fixed top-4 right-4 z-20">
                <ModeToggle />
            </div>

            {/* Grid background */}
            <div
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(182, 149, 74, 0.15) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(182, 149, 74, 0.15) 1px, transparent 1px)
                    `,
                    backgroundSize: "20px 20px",
                    maskImage: `
                        repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px),
                        repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px),
                        radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
                    `,
                    WebkitMaskImage: `
                        repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px),
                        repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px),
                        radial-gradient(ellipse 100% 80% at 50% 100%, #000 50%, transparent 90%)
                    `,
                    maskComposite: "intersect",
                    WebkitMaskComposite: "source-in",
                }}
            />

            <div className="relative z-10 flex min-h-svh items-center justify-center px-6 py-16">
                <div className="w-full max-w-md text-center">
                    <img
                        src="/assets/pdl-logo.png"
                        alt="Peace-Driven Leadership"
                        className="mx-auto mb-8 h-16 w-auto object-contain"
                    />

                    {/* Status icon */}
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                        <Clock className="h-9 w-9 text-primary" />
                    </div>

                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                        <span className="font-mono text-[9px] tracking-[4px] text-amber-500 uppercase">
                            Pending Approval
                        </span>
                    </div>

                    <h1 className="mb-3 mt-4 text-3xl font-bold tracking-tight text-foreground">
                        You're almost in, {user.firstName}!
                    </h1>

                    {isCustom ? (
                        <p className="mb-8 text-base text-muted-foreground">
                            You selected the <span className="font-semibold text-foreground">Custom</span> plan. Our team will reach out to you shortly to discuss the details and get your account set up.
                        </p>
                    ) : (
                        <p className="mb-8 text-base text-muted-foreground">
                            You selected the <span className="font-semibold text-foreground">{planLabel}</span> plan. Once we confirm your payment, your account will be activated and you'll receive an email to get started.
                        </p>
                    )}

                    {/* Steps */}
                    <div className="mb-8 rounded-2xl border border-border/60 bg-card p-6 text-left">
                        <p className="mb-4 font-mono text-[9px] tracking-[3px] text-muted-foreground uppercase">
                            What happens next
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Plan selected</p>
                                    <p className="text-xs text-muted-foreground">{planLabel} plan — waiting for confirmation</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
                                    <span className="font-mono text-[9px] font-bold text-primary">2</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {isCustom ? "Team reaches out" : "Payment confirmed"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {isCustom
                                            ? "We'll contact you to finalize your custom plan"
                                            : "Our team will verify and approve your payment"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                                    <span className="font-mono text-[9px] font-bold text-muted-foreground">3</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-muted-foreground">Access granted</p>
                                    <p className="text-xs text-muted-foreground">You'll receive an email when your account is activated</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button asChild variant="outline" className="h-11 rounded-xl">
                            <Link href="/plans">
                                Change Plan
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="h-11 rounded-xl gap-2">
                            <Link href="/api/auth/logout">
                                <Mail className="h-4 w-4" />
                                Sign Out
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
