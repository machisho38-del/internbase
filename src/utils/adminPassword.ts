const ALGORITHM = 'pbkdf2_sha256'
const ITERATIONS = 100000

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array()
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return difference === 0
}

async function derive(password: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    hash: 'SHA-256',
    salt: hexToBytes(saltHex),
    iterations
  }, key, 256)
  return bytesToHex(new Uint8Array(bits))
}

async function legacyHash(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(password + 'intern_salt_2024')
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  const saltHex = bytesToHex(salt)
  return `${ALGORITHM}$${ITERATIONS}$${saltHex}$${await derive(password, saltHex, ITERATIONS)}`
}

export async function verifyAdminPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return { valid: false, needsUpgrade: false }
  const [algorithm, iterationsText, saltHex, expectedHash] = storedHash.split('$')

  if (algorithm === ALGORITHM && iterationsText && saltHex && expectedHash) {
    const iterations = Number(iterationsText)
    if (!Number.isInteger(iterations) || iterations < 1 || hexToBytes(saltHex).length === 0) {
      return { valid: false, needsUpgrade: false }
    }
    const candidate = await derive(password, saltHex, iterations)
    return { valid: timingSafeEqual(candidate, expectedHash), needsUpgrade: iterations < ITERATIONS }
  }

  const candidate = await legacyHash(password)
  return { valid: timingSafeEqual(candidate, storedHash), needsUpgrade: true }
}
