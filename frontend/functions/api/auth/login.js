import { json, error, handleOptions } from '../../_utils/response.js'
import { verifyPassword, createToken } from '../../_utils/auth.js'
import { queryOne } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  if (context.request.method !== 'POST') return error('Method not allowed', 405)

  try {
    const { username, password } = await context.request.json()
    if (!username || !password) return error('Username and password required')

    const user = await queryOne(context.env, 'SELECT * FROM users WHERE username = ? OR email = ?', [username, username])
    if (!user || !(await verifyPassword(password, user.password_hash))) return error('Invalid credentials', 401)

    const token = await createToken({ sub: user.id }, context.env.JWT_SECRET)
    const { password_hash, ...safe } = user
    return json({ token, user: safe })
  } catch (e) {
    return error(e.message, 500)
  }
}
