import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query, execute } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  const leadId = parseInt(context.params.id)
  if (!leadId) return error('Invalid lead ID')

  if (context.request.method === 'GET') {
    const leads = await query(context.env,
      'SELECT l.*, u.full_name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE l.id = ?', [leadId])
    if (!leads.length) return error('Lead not found', 404)
    return json({ lead: leads[0] })
  }

  if (context.request.method === 'PUT') {
    const data = await context.request.json()
    const fields = ['name', 'phone', 'email', 'source', 'project_interest', 'status', 'notes', 'assigned_to']
    const sets = fields.filter(f => f in data).map(f => `${f} = ?`)
    const values = fields.filter(f => f in data).map(f => data[f])

    if (!sets.length) return error('No fields to update')
    sets.push('updated_at = datetime(\'now\')')

    await execute(context.env,
      `UPDATE leads SET ${sets.join(', ')} WHERE id = ?`, [...values, leadId])

    await execute(context.env,
      'INSERT INTO activities (type, description, lead_id, user_id) VALUES (?, ?, ?, ?)',
      ['lead_updated', `Lead was updated`, leadId, user.id])

    const leads = await query(context.env,
      'SELECT l.*, u.full_name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE l.id = ?', [leadId])
    return json({ lead: leads[0] })
  }

  if (context.request.method === 'DELETE') {
    await execute(context.env, 'DELETE FROM leads WHERE id = ?', [leadId])
    return json({ message: 'Lead deleted' })
  }

  return error('Method not allowed', 405)
}
