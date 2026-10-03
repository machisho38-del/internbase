import assert from 'node:assert/strict'
import test from 'node:test'
import { hashAdminPassword, verifyAdminPassword } from '../src/utils/adminPassword.ts'

test('admin passwords use a salted adaptive hash', async () => {
  const first = await hashAdminPassword('correct horse battery staple')
  const second = await hashAdminPassword('correct horse battery staple')

  assert.match(first, /^pbkdf2_sha256\$100000\$/)
  assert.notEqual(first, second)
  assert.equal((await verifyAdminPassword('correct horse battery staple', first)).valid, true)
  assert.equal((await verifyAdminPassword('wrong password', first)).valid, false)
})

test('legacy admin hashes remain valid and are marked for automatic upgrade', async () => {
  const password = 'existing admin password'
  const legacyBytes = new TextEncoder().encode(password + 'intern_salt_2024')
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', legacyBytes))
  const legacyHash = Array.from(digest).map(byte => byte.toString(16).padStart(2, '0')).join('')

  assert.deepEqual(await verifyAdminPassword(password, legacyHash), {
    valid: true,
    needsUpgrade: true
  })
})
