import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  const users = await query(context.env, 'SELECT id, username, email, full_name, role, avatar, created_at FROM users')
  return json({ users })
}
