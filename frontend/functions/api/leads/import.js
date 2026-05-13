import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { execute, getLastInsertId } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  if (context.request.method !== 'POST') return error('Method not allowed', 405)

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  try {
    const formData = await context.request.formData()
    const file = formData.get('file')
    if (!file) return error('No file provided')

    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return error('CSV must have a header row and at least one data row')

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows = lines.slice(1)

    let imported = 0
    const errors = []

    for (let i = 0; i < rows.length; i++) {
      try {
        const cols = rows[i].split(',').map(c => c.trim())
        const row = {}
        headers.forEach((h, idx) => { row[h] = cols[idx] || '' })

        await execute(context.env,
          `INSERT INTO leads (name, phone, email, source, project_interest, status, notes, assigned_to, imported_from)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'csv')`,
          [
            row.name || row.Name || `Lead #${i + 1}`,
            row.phone || row.Phone || row.mobile || '',
            row.email || row.Email || '',
            row.source || row.Source || '',
            row.project_interest || row.Project || row.project || '',
            row.status || row.Status || 'New',
            row.notes || row.Notes || '',
            user.id,
          ]
        )
        imported++
      } catch (e) {
        errors.push({ row: i + 2, error: e.message })
      }
    }

    await execute(context.env,
      'INSERT INTO activities (type, description, user_id) VALUES (?, ?, ?)',
      ['import', `Imported ${imported} leads from CSV`, user.id])

    return json({ message: `Imported ${imported} leads`, imported, errors }, 201)
  } catch (e) {
    return error(e.message, 500)
  }
}
