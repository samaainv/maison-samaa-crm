import { useState, useEffect } from 'react'
import { Users, Building2, Megaphone, TrendingUp, KanbanSquare, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../api/client'
import StatsCard from '../components/StatsCard'

const COLORS = ['#c9a84c', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#10b981', '#ef4444']

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [recentLeads, setRecentLeads] = useState([])
  const [recentProps, setRecentProps] = useState([])

  useEffect(() => {
    api.get('/marketing/analytics').then((r) => setAnalytics(r.data))
    api.get('/leads').then((r) => setRecentLeads(r.data.leads.slice(0, 5)))
    api.get('/properties').then((r) => setRecentProps(r.data.properties.slice(0, 5)))
  }, [])

  const statusData = analytics
    ? Object.entries(analytics.leads_by_status).map(([name, value]) => ({ name, value }))
    : []

  const propStatusData = analytics
    ? Object.entries(analytics.properties_by_status).map(([name, value]) => ({ name, value }))
    : []

  const pipelineData = analytics
    ? Object.entries(analytics.pipeline_stages || {}).map(([name, value]) => ({ name, value }))
    : []

  const closedCount = analytics?.leads_by_status?.Closed || 0
  const conversion = analytics?.total_leads
    ? `${Math.round((closedCount / analytics.total_leads) * 100)}%`
    : '—'

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Leads" value={analytics?.total_leads ?? '—'} icon={Users} />
        <StatsCard title="Properties" value={analytics?.total_properties ?? '—'} icon={Building2} color="blue" />
        <StatsCard title="Active Deals" value={analytics?.total_deals ?? '—'} icon={KanbanSquare} color="purple" />
        <StatsCard title="Campaigns" value={analytics?.total_campaigns ?? '—'} icon={Megaphone} color="green" />
        <StatsCard title="Conversion" value={conversion} icon={TrendingUp} subtitle={`${closedCount} closed`} color="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ms-muted mb-4">Leads by Status</h3>
          {statusData.length === 0 ? (
            <div className="flex items-center gap-2 text-ms-muted text-sm py-8"><AlertCircle size={16} /> No lead data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="name" stroke="#6b6b6b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b6b6b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="value" fill="#c9a84c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ms-muted mb-4">Properties by Status</h3>
          {propStatusData.length === 0 ? (
            <div className="flex items-center gap-2 text-ms-muted text-sm py-8"><AlertCircle size={16} /> No property data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={propStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                  {propStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {propStatusData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </div>

        <div className="card col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ms-muted mb-4">Pipeline Stages</h3>
          {pipelineData.length === 0 ? (
            <div className="flex items-center gap-2 text-ms-muted text-sm py-8"><AlertCircle size={16} /> No deals in pipeline</div>
          ) : (
            <div className="space-y-3">
              {pipelineData.map((item, i) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.name}</span>
                    <span className="text-ms-gold font-medium">{item.value}</span>
                  </div>
                  <div className="w-full h-2 bg-ms-dark rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(item.value / Math.max(...pipelineData.map((d) => d.value), 1)) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ms-muted mb-4">Recent Leads</h3>
          {recentLeads.length === 0 ? (
            <p className="text-ms-muted text-sm">No leads yet</p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-ms-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-ms-muted">{lead.source || '—'} {lead.project_interest ? `· ${lead.project_interest}` : ''}</p>
                  </div>
                  <span className={`badge badge-${lead.status}`}>{lead.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ms-muted mb-4">Recent Properties</h3>
          {recentProps.length === 0 ? (
            <p className="text-ms-muted text-sm">No properties listed</p>
          ) : (
            <div className="space-y-2">
              {recentProps.map((prop) => (
                <div key={prop.id} className="flex items-center justify-between py-2 border-b border-ms-border/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate max-w-[240px]">{prop.title}</p>
                    <p className="text-xs text-ms-muted">{prop.project_name || '—'} · {prop.unit_type || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-ms-gold">AED {prop.price?.toLocaleString()}</p>
                    <span className={`badge badge-${prop.status}`}>{prop.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
