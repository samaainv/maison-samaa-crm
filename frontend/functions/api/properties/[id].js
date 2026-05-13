import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query, execute } from '../../_utils/db.js'

function slugify(title) { return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  const propId = parseInt(context.params.id)

  if (context.request.method === 'GET') {
    const props = await query(context.env,
      'SELECT p.*, u.full_name as listed_by_name FROM properties p LEFT JOIN users u ON p.listed_by = u.id WHERE p.id = ?', [propId])
    if (!props.length) return error('Property not found', 404)
    const p = props[0]
    p.features = p.features ? p.features.split(',') : []
    p.images = p.images ? p.images.split(',') : []
    return json({ property: p })
  }

  if (context.request.method === 'PUT') {
    const data = await context.request.json()
    const fields = ['title', 'project_name', 'unit_type', 'property_type', 'status', 'price',
      'area_sqm', 'bedrooms', 'bathrooms', 'location', 'city', 'description']
    const sets = fields.filter(f => f in data).map(f => `${f} = ?`)
    const values = fields.filter(f => f in data).map(f => data[f])

    if ('features' in data) { sets.push('features = ?'); values.push(data.features.join(',')) }
    if ('images' in data) { sets.push('images = ?'); values.push(data.images.join(',')) }
    if ('title' in data) { sets.push('slug = ?'); values.push(slugify(data.title)) }

    if (!sets.length) return error('No fields to update')
    sets.push('updated_at = datetime(\'now\')')
    values.push(propId)

    await execute(context.env, `UPDATE properties SET ${sets.join(', ')} WHERE id = ?`, values)
    const props = await query(context.env,
      'SELECT p.*, u.full_name as listed_by_name FROM properties p LEFT JOIN users u ON p.listed_by = u.id WHERE p.id = ?', [propId])
    const p = props[0]
    p.features = p.features ? p.features.split(',') : []
    p.images = p.images ? p.images.split(',') : []
    return json({ property: p })
  }

  if (context.request.method === 'DELETE') {
    await execute(context.env, 'DELETE FROM properties WHERE id = ?', [propId])
    return json({ message: 'Property deleted' })
  }

  return error('Method not allowed', 405)
}
