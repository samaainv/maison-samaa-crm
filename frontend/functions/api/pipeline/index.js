import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query, execute, getLastInsertId } from '../../_utils/db.js'

const STAGES = ['Lead', 'Presentation', 'Site Visit', 'Reservation', 'Contracted']

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  if (context.request.method === 'GET') {
    const deals = await query(context.env,
      `SELECT d.*, l.name as lead_name, l.phone as lead_phone, p.title as property_title,
              u.full_name as assigned_name
       FROM deals d
       LEFT JOIN leads l ON d.lead_id = l.id
       LEFT JOIN properties p ON d.property_id = p.id
       LEFT JOIN users u ON d.assigned_to = u.id
       ORDER BY d.stage_order`)
    const grouped = {}
    STAGES.forEach(s => { grouped[s] = [] })
    deals.forEach(d => {
      const stage = STAGES.includes(d.stage) ? d.stage : 'Lead'
      grouped[stage].push(d)
    })
    return json({ pipeline: grouped, stages: STAGES })
  }

  if (context.request.method === 'POST') {
    const data = await context.request.json()
    if (!data.lead_id) return error('lead_id is required')

    const maxOrder = await query(context.env,
      'SELECT COALESCE(MAX(stage_order), 0) + 1 as next_order FROM deals WHERE stage = ?', [data.stage || 'Lead'])
    const nextOrder = maxOrder[0]?.next_order || 1

    const id = await getLastInsertId(context.env)
    await execute(context.env,
      `INSERT INTO deals (lead_id, property_id, stage, stage_order, value, notes, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.lead_id, data.property_id || null, data.stage || 'Lead', nextOrder,
       data.value || null, data.notes || '', data.assigned_to || user.id]
    )

    await execute(context.env,
      'INSERT INTO activities (type, description, user_id) VALUES (?, ?, ?)',
      ['deal_created', `Deal added to ${data.stage || 'Lead'} stage`, user.id])

    const deal = await query(context.env,
      `SELECT d.*, l.name as lead_name, l.phone as lead_phone, p.title as property_title,
              u.full_name as assigned_name
       FROM deals d
       LEFT JOIN leads l ON d.lead_id = l.id
       LEFT JOIN properties p ON d.property_id = p.id
       LEFT JOIN users u ON d.assigned_to = u.id
       WHERE d.id = ?`, [id])
    return json({ deal: deal[0] }, 201)
  }

  return error('Method not allowed', 405)
}
