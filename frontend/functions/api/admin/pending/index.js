import { json, error, handleOptions } from '../../../_utils/response.js'
import { getUserFromRequest } from '../../../_utils/auth.js'
import { query, execute, getLastInsertId } from '../../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  if (context.request.method === 'GET') {
    const url = new URL(context.request.url)
    const status = url.searchParams.get('status') || 'pending'
    const changes = await query(context.env,
      `SELECT pc.*, sub.full_name as submitted_name, rev.full_name as reviewer_name
       FROM pending_changes pc
       LEFT JOIN users sub ON pc.submitted_by = sub.id
       LEFT JOIN users rev ON pc.reviewed_by = rev.id
       WHERE pc.status = ?
       ORDER BY pc.created_at DESC`, [status])
    return json({ changes })
  }

  if (context.request.method === 'POST') {
    const data = await context.request.json()
    if (!data.entity_type || !data.entity_id) return error('entity_type and entity_id required')

    const id = await getLastInsertId(context.env)
    await execute(context.env,
      `INSERT INTO pending_changes (entity_type, entity_id, field_name, old_value, new_value, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.entity_type, data.entity_id, data.field_name || '', String(data.old_value || ''),
       String(data.new_value || ''), user.id]
    )
    const change = await query(context.env, 'SELECT * FROM pending_changes WHERE id = ?', [id])
    return json({ change: change[0] }, 201)
  }

  return error('Method not allowed', 405)
}
