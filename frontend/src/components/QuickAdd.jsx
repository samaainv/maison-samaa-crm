import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import api from '../api/client'

const sources = ['Facebook', 'Instagram', 'Web', 'Referral', 'Walk-in']
const projects = ['Zahw', 'Taj City', 'Origami', 'Other']

export default function QuickAdd({ open, onClose, onSaved, users }) {
  const [tab, setTab] = useState('lead')
  const [saving, setSaving] = useState(false)

  const [leadForm, setLeadForm] = useState({
    name: '', phone: '', source: '', project_interest: '', assigned_to: '',
  })

  const [propForm, setPropForm] = useState({
    title: '', project_name: '', unit_type: '', price: '', status: 'Available',
  })

  if (!open) return null

  const saveLead = async () => {
    if (!leadForm.name.trim()) return
    setSaving(true)
    try {
      await api.post('/leads', { ...leadForm, status: 'New' })
      setLeadForm({ name: '', phone: '', source: '', project_interest: '', assigned_to: '' })
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  const saveProperty = async () => {
    if (!propForm.title.trim() || !propForm.price) return
    setSaving(true)
    try {
      await api.post('/properties', {
        ...propForm,
        price: parseFloat(propForm.price),
        features: [],
        images: [],
      })
      setPropForm({ title: '', project_name: '', unit_type: '', price: '', status: 'Available' })
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70">
      <div className="bg-ms-card border border-ms-border rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Quick Add</h3>
          <button onClick={onClose} className="text-ms-muted hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-5">
          <button onClick={() => setTab('lead')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'lead' ? 'bg-ms-gold/10 text-ms-gold border border-ms-gold/20' : 'bg-ms-dark text-ms-muted border border-ms-border'
            }`}>Lead</button>
          <button onClick={() => setTab('property')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'property' ? 'bg-ms-gold/10 text-ms-gold border border-ms-gold/20' : 'bg-ms-dark text-ms-muted border border-ms-border'
            }`}>Property</button>
        </div>

        {tab === 'lead' ? (
          <div className="space-y-3">
            <input type="text" placeholder="Full name *" value={leadForm.name}
              onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} className="input-field" />
            <input type="text" placeholder="Phone number" value={leadForm.phone}
              onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} className="input-field" />
            <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })} className="input-field">
              <option value="">Source</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={leadForm.project_interest} onChange={(e) => setLeadForm({ ...leadForm, project_interest: e.target.value })} className="input-field">
              <option value="">Project interest</option>
              {projects.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {users?.length > 0 && (
              <select value={leadForm.assigned_to} onChange={(e) => setLeadForm({ ...leadForm, assigned_to: e.target.value })} className="input-field">
                <option value="">Assign to</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            )}
            <button onClick={saveLead} disabled={saving || !leadForm.name.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={16} /> {saving ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="text" placeholder="Property title *" value={propForm.title}
              onChange={(e) => setPropForm({ ...propForm, title: e.target.value })} className="input-field" />
            <select value={propForm.project_name} onChange={(e) => setPropForm({ ...propForm, project_name: e.target.value })} className="input-field">
              <option value="">Project</option>
              {projects.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={propForm.unit_type} onChange={(e) => setPropForm({ ...propForm, unit_type: e.target.value })} className="input-field">
              <option value="">Unit type</option>
              <option value="Studio">Studio</option>
              <option value="1BR">1BR</option>
              <option value="2BR">2BR</option>
              <option value="3BR">3BR</option>
              <option value="Villa">Villa</option>
              <option value="Penthouse">Penthouse</option>
            </select>
            <input type="number" placeholder="Price (AED) *" value={propForm.price}
              onChange={(e) => setPropForm({ ...propForm, price: e.target.value })} className="input-field" />
            <select value={propForm.status} onChange={(e) => setPropForm({ ...propForm, status: e.target.value })} className="input-field">
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>
            <button onClick={saveProperty} disabled={saving || !propForm.title.trim() || !propForm.price}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={16} /> {saving ? 'Adding...' : 'Add Property'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
