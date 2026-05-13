import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query, execute, getLastInsertId } from '../../_utils/db.js'

function slugify(title) { return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(context.request, context.env)

  if (context.request.method === 'GET') {
    const url = new URL(context.request.url)
    const status = url.searchParams.get('status')
    const project = url.searchParams.get('project_name')
    const unitType = url.searchParams.get('unit_type')
    const minPrice = url.searchParams.get('min_price')
    const maxPrice = url.searchParams.get('max_price')
    const search = url.searchParams.get('search')

    let sql = 'SELECT p.*, u.full_name as listed_by_name FROM properties p LEFT JOIN users u ON p.listed_by = u.id'
    const conditions = []
    const params = []

    if (status) { conditions.push('p.status = ?'); params.push(status) }
    if (project) { conditions.push('p.project_name = ?'); params.push(project) }
    if (unitType) { conditions.push('p.unit_type = ?'); params.push(unitType) }
    if (minPrice) { conditions.push('p.price >= ?'); params.push(parseFloat(minPrice)) }
    if (maxPrice) { conditions.push('p.price <= ?'); params.push(parseFloat(maxPrice)) }
    if (search) { const l = `%${search}%`; conditions.push('(p.title LIKE ? OR p.project_name LIKE ? OR p.location LIKE ?)'); params.push(l, l, l) }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ')
    sql += ' ORDER BY p.created_at DESC'

    const properties = await query(context.env, sql, params)
    return json({ properties: properties.map(p => ({ ...p, features: p.features ? p.features.split(',') : [], images: p.images ? p.images.split(',') : [] })) })
  }

  if (context.request.method === 'POST') {
    if (!user) return error('Unauthorized', 401)
    const data = await context.request.json()
    if (!data.title || !data.price) return error('Title and price required')

    const id = await getLastInsertId(context.env)
    await execute(context.env,
      `INSERT INTO properties (title, slug, project_name, unit_type, property_type, status, price, area_sqm, bedrooms, bathrooms, location, city, description, features, images, listed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, slugify(data.title), data.project_name || '', data.unit_type || '', data.property_type || '',
       data.status || 'Available', parseFloat(data.price), data.area_sqm || null, data.bedrooms || null, data.bathrooms || null,
       data.location || '', data.city || '', data.description || '', (data.features || []).join(','),
       (data.images || []).join(','), user.id]
    )

    const props = await query(context.env, 'SELECT p.*, u.full_name as listed_by_name FROM properties p LEFT JOIN users u ON p.listed_by = u.id WHERE p.id = ?', [id])
    return json({ property: props[0] }, 201)
  }

  return error('Method not allowed', 405)
}
