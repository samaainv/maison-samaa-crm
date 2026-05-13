import { json, error, handleOptions } from '../../../_utils/response.js'
import { getUserFromRequest } from '../../../_utils/auth.js'
import { query, execute, getLastInsertId } from '../../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  const leadId = parseInt(context.params.id)

  if (context.request.method === 'GET') {
    const activities = await query(context.env,
      'SELECT a.*, u.full_name as user_name FROM activities a LEFT JOIN users u ON a.user_id = u.id WHERE a.lead_id = ? ORDER BY a.created_at DESC', [leadId])
    return json({ activities })
  }

  if (context.request.method === 'POST') {
    const data = await context.request.json()
    if (!data.description) return error('Description is required')

    const id = await getLastInsertId(context.env)
    await execute(context.env,
      'INSERT INTO activities (type, description, lead_id, user_id) VALUES (?, ?, ?, ?)',
      [data.type || 'note', data.description, leadId, user.id])

    const activity = await query(context.env,
      'SELECT a.*, u.full_name as user_name FROM activities a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = ?', [id])
    return json({ activity: activity[0] }, 201)
  }

  return error('Method not allowed', 405)
}
