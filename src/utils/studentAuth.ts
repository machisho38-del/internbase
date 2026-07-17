import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

const STUDENT_SESSION_COOKIE = 'student_session'
const STUDENT_SESSION_MAX_AGE = 60 * 60 * 24 * 30
const PASSWORD_HASH_ALGORITHM = 'pbkdf2_sha256'
const PASSWORD_HASH_ITERATIONS = 100000

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function legacySha256Hash(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'intern_student_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(hashBuffer))
}

async function derivePasswordHash(password: string, saltHex: string, iterations: number): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: hexToBytes(saltHex),
      iterations
    },
    key,
    256
  )
  return bytesToHex(new Uint8Array(bits))
}

export async function hashStudentPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  const saltHex = bytesToHex(salt)
  const hashHex = await derivePasswordHash(password, saltHex, PASSWORD_HASH_ITERATIONS)
  return `${PASSWORD_HASH_ALGORITHM}$${PASSWORD_HASH_ITERATIONS}$${saltHex}$${hashHex}`
}

export async function verifyStudentPassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  if (!storedHash) return false

  const [algorithm, iterationsText, saltHex, hashHex] = storedHash.split('$')
  if (algorithm === PASSWORD_HASH_ALGORITHM && iterationsText && saltHex && hashHex) {
    const iterations = Number(iterationsText)
    if (!Number.isInteger(iterations) || iterations < 1) return false
    const candidate = await derivePasswordHash(password, saltHex, iterations)
    return timingSafeEqualHex(candidate, hashHex)
  }

  const legacy = await legacySha256Hash(password)
  return timingSafeEqualHex(legacy, storedHash)
}

function generateStudentSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return bytesToHex(array)
}

function sqliteDateTimeAfter(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString().replace('T', ' ').slice(0, 19)
}

function isSecureRequest(c: any): boolean {
  try {
    return new URL(c.req.url).protocol === 'https:'
  } catch {
    return true
  }
}

export async function createStudentSession(c: any, studentId: number) {
  const token = generateStudentSessionToken()
  const expiresAt = sqliteDateTimeAfter(STUDENT_SESSION_MAX_AGE)

  await c.env.DB.prepare(
    `INSERT INTO student_sessions (student_id, token, expires_at) VALUES (?, ?, ?)`
  ).bind(studentId, token, expiresAt).run()

  await c.env.DB.prepare(
    `DELETE FROM student_sessions WHERE student_id = ? AND expires_at <= datetime('now')`
  ).bind(studentId).run()

  setCookie(c, STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecureRequest(c),
    sameSite: 'Strict',
    path: '/',
    maxAge: STUDENT_SESSION_MAX_AGE
  })
}

export async function getStudentFromSession(c: any) {
  const token = getCookie(c, STUDENT_SESSION_COOKIE)
  if (!token) return null

  return await c.env.DB.prepare(`
    SELECT s.id, s.last_name, s.first_name, s.email, s.university, s.grade,
           s.my_invite_code, s.status
    FROM student_sessions ss
    JOIN students s ON s.id = ss.student_id
    WHERE ss.token = ?
      AND ss.expires_at > datetime('now')
      AND s.status = 'active'
  `).bind(token).first() as any
}

export async function clearStudentSession(c: any) {
  const token = getCookie(c, STUDENT_SESSION_COOKIE)
  if (token) {
    await c.env.DB.prepare(`DELETE FROM student_sessions WHERE token = ?`).bind(token).run()
  }
  deleteCookie(c, STUDENT_SESSION_COOKIE, { path: '/' })
}
