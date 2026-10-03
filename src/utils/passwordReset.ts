import type { Bindings } from '../types'

export const PASSWORD_RESET_MAX_AGE_SECONDS = 60 * 30

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character] || character)
}

export function generatePasswordResetToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

export async function hashPasswordResetToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return bytesToHex(new Uint8Array(digest))
}

export function passwordResetExpiresAt(now = Date.now()): string {
  return new Date(now + PASSWORD_RESET_MAX_AGE_SECONDS * 1000)
    .toISOString().replace('T', ' ').slice(0, 19)
}

export function isPasswordResetEmailConfigured(env: Bindings): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.PASSWORD_RESET_FROM_EMAIL?.trim())
}

export async function sendPasswordResetEmail(
  env: Bindings,
  recipient: string,
  resetUrl: string
): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.PASSWORD_RESET_FROM_EMAIL?.trim()
  if (!apiKey || !from) return false

  const safeUrl = escapeHtml(resetUrl)
  const payload: Record<string, unknown> = {
    from,
    to: [recipient],
    subject: '【ガクチカインターン】パスワード再設定のご案内',
    text: `パスワード再設定のリクエストを受け付けました。\n\n30分以内に次のURLから再設定してください。\n${resetUrl}\n\n心当たりがない場合は、このメールを破棄してください。`,
    html: `<p>パスワード再設定のリクエストを受け付けました。</p><p>30分以内に次のリンクから再設定してください。</p><p><a href="${safeUrl}">パスワードを再設定する</a></p><p>心当たりがない場合は、このメールを破棄してください。</p>`
  }
  if (env.PASSWORD_RESET_REPLY_TO?.trim()) payload.reply_to = env.PASSWORD_RESET_REPLY_TO.trim()

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    if (!response.ok) console.error('Password reset email delivery failed', response.status)
    return response.ok
  } catch {
    console.error('Password reset email delivery failed')
    return false
  }
}
