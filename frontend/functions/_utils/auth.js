const JWT_ALGO = 'HS256'

export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 32)
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt),     iterations: 10000, hash: 'SHA-256' },
    key, 256
  )
  const hex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${salt}$${hex}`
}

export async function verifyPassword(password, stored) {
  const [salt, hsh] = stored.split('$')
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt),     iterations: 10000, hash: 'SHA-256' },
    key, 256
  )
  const hex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex === hsh
}

export async function createToken(payload, secret) {
  const encoder = new TextEncoder()
  const header = { alg: JWT_ALGO, typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat: now, exp: now + 86400 }

  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const headerB64 = b64(header)
  const bodyB64 = b64(body)
  const message = `${headerB64}.${bodyB64}`

  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${message}.${sigB64}`
}

export async function verifyToken(token, secret) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const message = `${parts[0]}.${parts[1]}`
    const sigB64 = parts[2].replace(/-/g, '+').replace(/_/g, '/')
    const sig = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const valid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(message))

    if (!valid) return null

    const body = JSON.parse(atob(parts[1]))
    if (body.exp < Math.floor(Date.now() / 1000)) return null

    return body
  } catch {
    return null
  }
}

export async function getUserFromRequest(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const token = auth.slice(7)
  const payload = await verifyToken(token, env.JWT_SECRET)
  if (!payload) return null

  const { queryOne } = await import('./db.js')
  return await queryOne(env, 'SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?', [payload.sub])
}
