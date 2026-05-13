import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query, execute, getLastInsertId } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  if (context.request.method === 'GET') {
    const url = new URL(context.request.url)
    const status = url.searchParams.get('status')
    const source = url.searchParams.get('source')
    const project = url.searchParams.get('project_interest')
    const assigned = url.searchParams.get('assigned_to')
    const search = url.searchParams.get('search')

    let sql = 'SELECT l.*, u.full_name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id'
    const conditions = []
    const params = []

    if (status) { conditions.push('l.status = ?'); params.push(status) }
    if (source) { conditions.push('l.source = ?'); params.push(source) }
    if (project) { conditions.push('l.project_interest = ?'); params.push(project) }
    if (assigned) { conditions.push('l.assigned_to = ?'); params.push(parseInt(assigned)) }
    if (search) { conditions.push('(l.name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)'); const like = `%${search}%`; params.push(like, like, like) }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY l.created_at DESC'

    const leads = await query(context.env, sql, params)
    return json({ leads })
  }

  if (context.request.method === 'POST') {
    const data = await context.request.json()
    if (!data.name) return error('Name is required')

    await execute(context.env,
      `INSERT INTO leads (name, phone, email, source, project_interest, status, notes, assigned_to, imported_from)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.phone || '', data.email || '', data.source || '', data.project_interest || '',
       data.status || 'New', data.notes || '', data.assigned_to || user.id, data.imported_from || 'manual']
    )
    const id = await getLastInsertId(context.env)

    await execute(context.env,
      'INSERT INTO activities (type, description, lead_id, user_id) VALUES (?, ?, ?, ?)',
      ['lead_created', `Lead ${data.name} was created`, id, user.id]
    )

    const lead = await query(context.env,
      'SELECT l.*, u.full_name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id WHERE l.id = ?', [id])
    return json({ lead: lead[0] }, 201)
  }

  return error('Method not allowed', 405)
}
