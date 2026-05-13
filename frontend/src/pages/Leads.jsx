import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Upload, X, Phone, Mail, Calendar, Download } from 'lucide-react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import QuickAdd from '../components/QuickAdd'

const statuses = ['New', 'Contacted', 'Follow-up', 'Closed']
const sources = ['Facebook', 'Instagram', 'Web', 'Referral', 'Walk-in']
const projects = ['Zahw', 'Taj City', 'Origami', 'Other']

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [activities, setActivities] = useState([])
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: '', project_interest: '',
    status: 'New', notes: '', assigned_to: '',
  })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    loadLeads()
    api.get('/auth/users').then((r) => setUsers(r.data.users)).catch(() => {})
  }, [])

  const loadLeads = async () => {
    setLoading(true)
    const params = {}
    if (statusFilter) params.status = statusFilter
    if (sourceFilter) params.source = sourceFilter
    if (projectFilter) params.project_interest = projectFilter
    if (search) params.search = search
    try {
      const res = await api.get('/leads', { params })
      setLeads(res.data.leads)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (form.id) {
        await api.put(`/leads/${form.id}`, form)
      } else {
        await api.post('/leads', form)
      }
      setShowModal(false)
      resetForm()
      loadLeads()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (lead) => {
    setForm(lead)
    setShowModal(true)
  }

  const openDetail = async (lead) => {
    setShowDetail(lead)
    try {
      const res = await api.get(`/leads/${lead.id}/activities`)
      setActivities(res.data.activities)
    } catch (err) {
      console.error(err)
    }
  }

  const addActivity = async (description) => {
    if (!description.trim()) return
    await api.post(`/leads/${showDetail.id}/activities`, { type: 'note', description })
    const res = await api.get(`/leads/${showDetail.id}/activities`)
    setActivities(res.data.activities)
  }

  const resetForm = () => {
    setForm({
      name: '', phone: '', email: '', source: '', project_interest: '',
      status: 'New', notes: '', assigned_to: '',
    })
  }

  const deleteLead = async (id) => {
    if (!confirm('Delete this lead?')) return
    await api.delete(`/leads/${id}`)
    setShowDetail(null)
    loadLeads()
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/leads/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImportResult({ type: 'success', message: res.data.message })
      loadLeads()
    } catch (err) {
      setImportResult({ type: 'error', message: err.response?.data?.error || 'Import failed' })
    } finally {
      setImporting(false)
      fileRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const csv = 'name,phone,email,source,project_interest,status,notes\n' +
      'Omar Hassan,+971501234567,omar@email.com,Instagram,Origami,New,Looking for penthouse\n' +
      'Layla Mohammed,+971502345678,layla@email.com,Facebook,Zahw,Contacted,Needs 4BR villa'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'leads_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const columns = [
    { key: 'name', label: 'Name', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'phone', label: 'Phone', render: (r) => r.phone || '—' },
    { key: 'source', label: 'Source' },
    { key: 'project_interest', label: 'Project', render: (r) => r.project_interest || '—' },
    { key: 'status', label: 'Status', render: (r) => <span className={`badge badge-${r.status}`}>{r.status}</span> },
    { key: 'assigned_name', label: 'Agent', render: (r) => r.assigned_name || '—' },
    { key: 'created_at', label: 'Date', render: (r) => new Date(r.created_at).toLocaleDateString() },
  ]

  const FilterBtn = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-ms-gold/10 text-ms-gold border border-ms-gold/20' : 'text-ms-muted hover:text-white border border-transparent'
      }`}>{label}</button>
  )

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ms-muted" size={16} />
            <input type="text" placeholder="Search leads..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLeads()}
              className="input-field pl-10 pr-4 w-56" />
          </div>
          <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setTimeout(loadLeads, 0) }}
            className="input-field w-32 text-xs">
            <option value="">All Sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setTimeout(loadLeads, 0) }}
            className="input-field w-32 text-xs">
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileRef} onChange={handleImport} accept=".csv,.xls,.xlsx" className="hidden" />
          <button onClick={downloadTemplate} className="btn-secondary text-xs flex items-center gap-1.5">
            <Download size={14} /> Template
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="btn-secondary text-xs flex items-center gap-1.5">
            <Upload size={14} /> {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Lead
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between ${
          importResult.type === 'success' ? 'bg-green-900/30 text-green-300 border border-green-800/30'
            : 'bg-red-900/30 text-red-300 border border-red-800/30'
        }`}>
          <span>{importResult.message}</span>
          <button onClick={() => setImportResult(null)}><X size={16} /></button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <FilterBtn label="All" active={!statusFilter} onClick={() => { setStatusFilter(''); loadLeads() }} />
        {statuses.map((s) => (
          <FilterBtn key={s} label={s} active={statusFilter === s}
            onClick={() => { setStatusFilter(s); loadLeads() }} />
        ))}
      </div>

      <div className="card p-0 overflow-x-auto">
        <DataTable columns={columns} data={leads} onRowClick={openDetail} />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-ms-card border border-ms-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{form.id ? 'Edit Lead' : 'New Lead'}</h3>
              <button onClick={() => setShowModal(false)} className="text-ms-muted hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Source</label>
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="input-field">
                  <option value="">Select</option>
                  {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Project Interest</label>
                <select value={form.project_interest} onChange={(e) => setForm({ ...form, project_interest: e.target.value })} className="input-field">
                  <option value="">Select</option>
                  {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Assign To</label>
                <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="input-field">
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-ms-card border border-ms-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{showDetail.name}</h3>
              <button onClick={() => setShowDetail(null)} className="text-ms-muted hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-ms-muted" /> {showDetail.phone || '—'}</div>
              <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-ms-muted" /> {showDetail.email || '—'}</div>
              <div className="flex gap-2 text-sm flex-wrap">
                <span className="text-ms-muted">Source:</span> {showDetail.source || '—'}
                <span className="text-ms-muted ml-4">Project:</span> {showDetail.project_interest || '—'}
                <span className="ml-4"><span className={`badge badge-${showDetail.status}`}>{showDetail.status}</span></span>
              </div>
              <div className="text-sm"><span className="text-ms-muted">Agent:</span> {showDetail.assigned_name || 'Unassigned'}</div>
              <div className="flex items-center gap-1 text-sm"><Calendar size={14} className="text-ms-muted" /> {new Date(showDetail.created_at).toLocaleDateString()}</div>
              {showDetail.notes && <div className="text-sm"><span className="text-ms-muted">Notes:</span> {showDetail.notes}</div>}
            </div>
            <div className="flex gap-3 mb-6">
              <button onClick={() => { setShowModal(false); openEdit(showDetail) }} className="btn-secondary text-sm">Edit</button>
              <button onClick={() => deleteLead(showDetail.id)} className="btn-danger text-sm">Delete</button>
            </div>
            <div className="border-t border-ms-border pt-4">
              <h4 className="text-sm font-semibold mb-3">Activity Log</h4>
              <div className="space-y-2 mb-4">
                {activities.length === 0 ? <p className="text-ms-muted text-sm">No activities</p> : (
                  activities.map((a) => (
                    <div key={a.id} className="border-l-2 border-ms-border pl-3 py-1 text-sm">
                      <p>{a.description}</p>
                      <p className="text-xs text-ms-muted">{a.user_name} — {new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
              <ActivityInput onAdd={addActivity} />
            </div>
          </div>
        </div>
      )}

      <QuickAdd
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onSaved={() => { loadLeads(); setShowQuickAdd(false) }}
        users={users}
      />

      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-ms-gold text-ms-black rounded-full shadow-lg shadow-ms-gold/20 flex items-center justify-center hover:bg-ms-gold-light transition-all duration-200 z-40"
      >
        <Plus size={28} />
      </button>
    </div>
  )
}

function ActivityInput({ onAdd }) {
  const [text, setText] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); onAdd(text); setText('') }} className="flex gap-2">
      <input type="text" value={text} onChange={(e) => setText(e.target.value)}
        placeholder="Add a note..." className="input-field flex-1" />
      <button type="submit" className="btn-primary text-sm">Add</button>
    </form>
  )
}
