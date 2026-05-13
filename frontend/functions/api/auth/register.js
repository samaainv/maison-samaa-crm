import { json, error, handleOptions } from '../../_utils/response.js'
import { hashPassword } from '../../_utils/auth.js'
import { queryOne, execute, getLastInsertId } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  if (context.request.method !== 'POST') return error('Method not allowed', 405)

  try {
    const data = await context.request.json()
    if (!data.username || !data.email || !data.password) return error('Username, email, password required')

    const existing = await queryOne(context.env, 'SELECT id FROM users WHERE username = ? OR email = ?', [data.username, data.email])
    if (existing) return error('Username or email already exists', 400)

    const hash = await hashPassword(data.password)
    await execute(context.env,
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [data.username, data.email, hash, data.full_name || '', data.role || 'agent']
    )
    const id = await getLastInsertId(context.env)
    const user = await queryOne(context.env, 'SELECT id, username, email, full_name, role, avatar, created_at FROM users WHERE id = ?', [id])

    return json({ message: 'User created', user }, 201)
  } catch (e) {
    return error(e.message, 500)
  }
}
