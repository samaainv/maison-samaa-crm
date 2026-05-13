import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  if (context.request.method !== 'GET') return error('Method not allowed', 405)

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  return json({ user })
}

export async function onRequestGet(context) {
  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)
  return json({ user })
}
