import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
    throw new Error("Add RESEND_API_KEY to .env.local")
}

const resend = new Resend(process.env.RESEND_API_KEY)

export default resend
