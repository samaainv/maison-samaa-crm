import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query, execute } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  const dealId = parseInt(context.params.id)

  if (context.request.method === 'PUT') {
    const data = await context.request.json()
    const fields = ['stage', 'stage_order', 'property_id', 'value', 'notes', 'assigned_to']
    const sets = fields.filter(f => f in data).map(f => `${f} = ?`)
    const values = fields.filter(f => f in data).map(f => data[f])
    if (!sets.length) return error('No fields to update')
    sets.push('updated_at = datetime(\'now\')')
    values.push(dealId)

    const oldDeal = await query(context.env, 'SELECT stage FROM deals WHERE id = ?', [dealId])
    const oldStage = oldDeal[0]?.stage

    await execute(context.env, `UPDATE deals SET ${sets.join(', ')} WHERE id = ?`, values)

    const desc = data.stage && data.stage !== oldStage
      ? `Moved from ${oldStage} to ${data.stage}`
      : 'Deal updated'
    await execute(context.env,
      'INSERT INTO activities (type, description, user_id) VALUES (?, ?, ?)',
      ['deal_updated', desc, user.id])

    const deal = await query(context.env,
      `SELECT d.*, l.name as lead_name, l.phone as lead_phone, p.title as property_title,
              u.full_name as assigned_name
       FROM deals d
       LEFT JOIN leads l ON d.lead_id = l.id
       LEFT JOIN properties p ON d.property_id = p.id
       LEFT JOIN users u ON d.assigned_to = u.id
       WHERE d.id = ?`, [dealId])
    return json({ deal: deal[0] })
  }

  if (context.request.method === 'DELETE') {
    await execute(context.env, 'DELETE FROM deals WHERE id = ?', [dealId])
    return json({ message: 'Deal removed from pipeline' })
  }

  return error('Method not allowed', 405)
}
