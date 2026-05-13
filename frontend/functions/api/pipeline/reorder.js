import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { execute } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  if (context.request.method !== 'PUT') return error('Method not allowed', 405)

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  const data = await context.request.json()
  const deals = data.deals || []

  for (const item of deals) {
    await execute(context.env,
      'UPDATE deals SET stage = ?, stage_order = ?, updated_at = datetime(\'now\') WHERE id = ?',
      [item.stage, item.stage_order || 0, item.id])
  }

  return json({ message: 'Pipeline reordered' })
}
