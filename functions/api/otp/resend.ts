// Cloudflare Pages Function: /api/otp/resend
import { onRequestPost as sendHandler } from './send'

export const onRequestPost = sendHandler
