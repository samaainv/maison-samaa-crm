import { json, error, handleOptions } from '../../../../_utils/response.js'
import { getUserFromRequest } from '../../../../_utils/auth.js'
import { query, execute } from '../../../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  if (context.request.method !== 'PUT') return error('Method not allowed', 405)

  const user = await getUserFromRequest(context.request, context.env)
  if (!user || user.role !== 'admin') return error('Admin access required', 403)

  const changeId = parseInt(context.params.id)
  const body = await context.request.json()

  await execute(context.env,
    "UPDATE pending_changes SET status = 'rejected', reviewed_by = ?, review_note = ?, reviewed_at = datetime('now') WHERE id = ?",
    [user.id, body.review_note || '', changeId])

  const updated = await query(context.env, 'SELECT * FROM pending_changes WHERE id = ?', [changeId])
  return json({ change: updated[0] })
}
