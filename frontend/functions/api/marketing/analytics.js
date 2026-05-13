import { json, error, handleOptions } from '../../_utils/response.js'
import { getUserFromRequest } from '../../_utils/auth.js'
import { query } from '../../_utils/db.js'

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return handleOptions()
  if (context.request.method !== 'GET') return error('Method not allowed', 405)

  const user = await getUserFromRequest(context.request, context.env)
  if (!user) return error('Unauthorized', 401)

  const totalLeads = (await query(context.env, 'SELECT COUNT(*) as c FROM leads'))[0]?.c || 0
  const totalProperties = (await query(context.env, 'SELECT COUNT(*) as c FROM properties'))[0]?.c || 0
  const totalCampaigns = (await query(context.env, 'SELECT COUNT(*) as c FROM campaigns'))[0]?.c || 0
  const totalDeals = (await query(context.env, 'SELECT COUNT(*) as c FROM deals'))[0]?.c || 0

  const leadsByStatus = {}
  for (const s of ['New', 'Contacted', 'Follow-up', 'Closed']) {
    const c = (await query(context.env, 'SELECT COUNT(*) as c FROM leads WHERE status = ?', [s]))[0]?.c || 0
    if (c > 0) leadsByStatus[s] = c
  }

  const propertiesByStatus = {}
  for (const s of ['Available', 'Reserved', 'Sold']) {
    const c = (await query(context.env, 'SELECT COUNT(*) as c FROM properties WHERE status = ?', [s]))[0]?.c || 0
    if (c > 0) propertiesByStatus[s] = c
  }

  const pipelineStages = {}
  for (const s of ['Lead', 'Presentation', 'Site Visit', 'Reservation', 'Contracted']) {
    const c = (await query(context.env, 'SELECT COUNT(*) as c FROM deals WHERE stage = ?', [s]))[0]?.c || 0
    if (c > 0) pipelineStages[s] = c
  }

  return json({
    total_leads: totalLeads,
    total_properties: totalProperties,
    total_campaigns: totalCampaigns,
    total_deals: totalDeals,
    leads_by_status: leadsByStatus,
    properties_by_status: propertiesByStatus,
    pipeline_stages: pipelineStages,
  })
}
