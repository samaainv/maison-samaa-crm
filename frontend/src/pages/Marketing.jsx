import { useState, useEffect } from 'react'
import { Plus, X, Send, Eye, MousePointer } from 'lucide-react'
import api from '../api/client'
import DataTable from '../components/DataTable'

const types = ['Email', 'Social Media', 'SMS', 'WhatsApp']
const campStatuses = ['draft', 'active', 'sent', 'paused']

export default function Marketing() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'Email', status: 'draft', subject: '',
    content: '', target_audience: '', scheduled_date: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadCampaigns() }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const res = await api.get('/marketing/campaigns')
      setCampaigns(res.data.campaigns)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        scheduled_date: form.scheduled_date || null,
      }
      if (form.id) {
        await api.put(`/marketing/campaigns/${form.id}`, payload)
      } else {
        await api.post('/marketing/campaigns', payload)
      }
      setShowModal(false)
      resetForm()
      loadCampaigns()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (c) => {
    setForm({
      ...c,
      scheduled_date: c.scheduled_date ? c.scheduled_date.slice(0, 16) : '',
    })
    setShowModal(true)
  }

  const deleteCamp = async (id) => {
    if (!confirm('Delete this campaign?')) return
    await api.delete(`/marketing/campaigns/${id}`)
    loadCampaigns()
  }

  const resetForm = () => {
    setForm({ name: '', type: 'Email', status: 'draft', subject: '', content: '', target_audience: '', scheduled_date: '' })
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status', render: (r) => <span className={`badge badge-${r.status}`}>{r.status}</span> },
    { key: 'target_audience', label: 'Audience' },
    {
      key: 'sent_count', label: 'Sent',
      render: (r) => (
        <span className="flex items-center gap-1"><Send size={12} className="text-ms-muted" /> {r.sent_count}</span>
      ),
    },
    {
      key: 'opened_count', label: 'Opened',
      render: (r) => (
        <span className="flex items-center gap-1"><Eye size={12} className="text-ms-muted" /> {r.opened_count}</span>
      ),
    },
    {
      key: 'clicked_count', label: 'Clicked',
      render: (r) => (
        <span className="flex items-center gap-1"><MousePointer size={12} className="text-ms-muted" /> {r.clicked_count}</span>
      ),
    },
    { key: 'created_at', label: 'Created', render: (r) => new Date(r.created_at).toLocaleDateString() },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm text-ms-muted">{campaigns.length} Campaign{campaigns.length !== 1 ? 's' : ''}</h3>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      <div className="card p-0">
        <DataTable columns={columns} data={campaigns} onRowClick={openEdit} />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-ms-card border border-ms-border rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{form.id ? 'Edit Campaign' : 'New Campaign'}</h3>
              <button onClick={() => setShowModal(false)} className="text-ms-muted hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                  {types.map((t) => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  {campStatuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Content</label>
                <textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Target Audience</label>
                <input type="text" value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="input-field" placeholder="e.g. All Leads, High-Value Leads" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Schedule Date</label>
                <input type="datetime-local" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="input-field" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              {form.id && (
                <button onClick={() => deleteCamp(form.id)} className="btn-danger">Delete</button>
              )}
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
