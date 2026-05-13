import { json, error, handleOptions } from '../../../../_utils/response.js'
import { getUserFromRequest } from '../../../../_utils/auth.js'
import { query, execute } from '../../../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  if (context.request.method !== 'PUT') return error('Method not allowed', 405)

  const user = await getUserFromRequest(context.request, context.env)
  if (!user || user.role !== 'admin') return error('Admin access required', 403)

  const changeId = parseInt(context.params.id)
  const change = (await query(context.env, 'SELECT * FROM pending_changes WHERE id = ?', [changeId]))[0]
  if (!change) return error('Change not found', 404)

  if (change.field_name) {
    const allowedTables = { property: 'properties', lead: 'leads' }
    const table = allowedTables[change.entity_type]
    if (table) {
      const allowedFields = ['status', 'price', 'name', 'notes', 'source', 'project_interest', 'assigned_to']
      if (!allowedFields.includes(change.field_name)) return error('Invalid field', 400)
      await execute(context.env,
        `UPDATE ${table} SET ${change.field_name} = ?, updated_at = datetime('now') WHERE id = ?`,
        [change.new_value, change.entity_id])
    }
  }

  await execute(context.env,
    "UPDATE pending_changes SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?",
    [user.id, changeId])

  const updated = await query(context.env, 'SELECT * FROM pending_changes WHERE id = ?', [changeId])
  return json({ change: updated[0] })
}
