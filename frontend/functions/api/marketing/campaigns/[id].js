import { json, error, handleOptions } from '../../../_utils/response.js'
import { getUserFromRequest } from '../../../_utils/auth.js'
import { query, execute } from '../../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  const id = parseInt(context.params.id)

  if (context.request.method === 'PUT') {
    const data = await context.request.json()
    const fields = ['name', 'type', 'status', 'subject', 'content', 'target_audience',
      'sent_count', 'opened_count', 'clicked_count', 'scheduled_date']
    const sets = fields.filter(f => f in data).map(f => `${f} = ?`)
    const values = fields.filter(f => f in data).map(f => data[f])
    if (!sets.length) return error('No fields to update')
    values.push(id)
    await execute(context.env, `UPDATE campaigns SET ${sets.join(', ')} WHERE id = ?`, values)
    const campaign = await query(context.env, 'SELECT * FROM campaigns WHERE id = ?', [id])
    return json({ campaign: campaign[0] })
  }

  if (context.request.method === 'DELETE') {
    await execute(context.env, 'DELETE FROM campaigns WHERE id = ?', [id])
    return json({ message: 'Campaign deleted' })
  }

  return error('Method not allowed', 405)
}
