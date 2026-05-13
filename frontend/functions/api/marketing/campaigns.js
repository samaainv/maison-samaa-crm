import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query, execute, getLastInsertId } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  if (context.request.method === 'GET') {
    const campaigns = await query(context.env, 'SELECT * FROM campaigns ORDER BY created_at DESC')
    return json({ campaigns })
  }

  if (context.request.method === 'POST') {
    const data = await context.request.json()
    if (!data.name) return error('Campaign name is required')

    const id = await getLastInsertId(context.env)
    await execute(context.env,
      `INSERT INTO campaigns (name, type, status, subject, content, target_audience, scheduled_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.type || '', data.status || 'draft', data.subject || '', data.content || '',
       data.target_audience || '', data.scheduled_date || null, user.id]
    )
    const campaign = await query(context.env, 'SELECT * FROM campaigns WHERE id = ?', [id])
    return json({ campaign: campaign[0] }, 201)
  }

  return error('Method not allowed', 405)
}
