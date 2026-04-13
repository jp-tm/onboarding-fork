import { NextResponse } from "next/server"

export async function POST() {
    const response = NextResponse.json({ success: true })
    clearAuthCookie(response)
    return response
}

export async function GET(request: Request) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    clearAuthCookie(response)
    return response
}

function clearAuthCookie(response: NextResponse) {
    response.cookies.set("auth_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(0),
        path: "/",
    })
}
