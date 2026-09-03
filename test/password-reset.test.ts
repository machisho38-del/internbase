import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PASSWORD_RESET_MAX_AGE_SECONDS,
  generatePasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetEmailConfigured,
  passwordResetExpiresAt
} from '../src/utils/passwordReset.ts'

test('password reset tokens are random 256-bit hexadecimal values', () => {
  const first = generatePasswordResetToken()
  const second = generatePasswordResetToken()
  assert.match(first, /^[a-f0-9]{64}$/)
  assert.match(second, /^[a-f0-9]{64}$/)
  assert.notEqual(first, second)
})

test('password reset token hashing is deterministic without storing the raw token', async () => {
  const token = 'a'.repeat(64)
  const first = await hashPasswordResetToken(token)
  const second = await hashPasswordResetToken(token)
  assert.equal(first, second)
  assert.match(first, /^[a-f0-9]{64}$/)
  assert.notEqual(first, token)
})

test('password reset links expire after 30 minutes', () => {
  const now = Date.UTC(2026, 8, 2, 0, 0, 0)
  const expected = new Date(now + PASSWORD_RESET_MAX_AGE_SECONDS * 1000)
    .toISOString().replace('T', ' ').slice(0, 19)
  assert.equal(passwordResetExpiresAt(now), expected)
})

test('email delivery requires both Resend settings', () => {
  assert.equal(isPasswordResetEmailConfigured({} as any), false)
  assert.equal(isPasswordResetEmailConfigured({ RESEND_API_KEY: 'key' } as any), false)
  assert.equal(isPasswordResetEmailConfigured({ PASSWORD_RESET_FROM_EMAIL: 'support@example.com' } as any), false)
  assert.equal(isPasswordResetEmailConfigured({ RESEND_API_KEY: 'key', PASSWORD_RESET_FROM_EMAIL: 'support@example.com' } as any), true)
})
