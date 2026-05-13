import { json, error } from '../../_utils/response.js'
import { execute, getLastInsertId, queryOne } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'GET') {
    const url = new URL(context.request.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode === 'subscribe' && token === 'maison-samaa-meta-verify-2026') {
      return new Response(challenge)
    }
    return error('Verification failed', 403)
  }

  if (context.request.method === 'POST') {
    try {
      const data = await context.request.json()
      const leadData = data.leadgen || data
      const fieldData = leadData.field_data || []

      let name = '', phone = '', email = ''
      for (const field of fieldData) {
        const fname = (field.name || '').toLowerCase()
        const fval = (field.values || [''])[0]
        if (fname.includes('full_name') || fname === 'name') name = fval
        else if (fname.includes('phone')) phone = fval
        else if (fname.includes('email')) email = fval
      }

      if (!name && !phone) return json({ error: 'No identifiable data' }, 400)

      if (phone) {
        const existing = await queryOne(context.env, 'SELECT id FROM leads WHERE phone = ?', [phone])
        if (existing) {
          await execute(context.env, "UPDATE leads SET source = 'Meta Lead Form', updated_at = datetime('now') WHERE id = ?", [existing.id])
          return json({ message: 'Lead updated' })
        }
      }

      const id = await getLastInsertId(context.env)
      await execute(context.env,
        `INSERT INTO leads (name, phone, email, source, status, imported_from, notes)
         VALUES (?, ?, ?, 'Meta Lead Form', 'Contacted', 'meta', ?)`,
        [name || 'Meta Lead', phone || '', email || '', `Imported from Meta Lead Form.\nRaw: ${JSON.stringify(fieldData).slice(0, 500)}`]
      )

      await execute(context.env,
        'INSERT INTO activities (type, description, lead_id) VALUES (?, ?, ?)',
        ['lead_created', `Lead ${name || 'Meta Lead'} imported from Meta Lead Form`, id]
      )

      return json({ message: 'Lead created', lead_id: id }, 201)
    } catch (e) {
      return error(e.message, 500)
    }
  }

  return error('Method not allowed', 405)
}
