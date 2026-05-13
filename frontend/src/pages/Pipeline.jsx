import { useState, useEffect, useCallback } from 'react'
import { Plus, X, GripVertical, Phone, DollarSign, User } from 'lucide-react'
import api from '../api/client'

const STAGES = ['Lead', 'Presentation', 'Site Visit', 'Reservation', 'Contracted']

export default function Pipeline() {
  const [pipeline, setPipeline] = useState({})
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragItem, setDragItem] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ lead_id: '', stage: 'Lead', value: '', notes: '' })

  useEffect(() => { loadPipeline(); loadLeads() }, [])

  const loadPipeline = async () => {
    try {
      const res = await api.get('/pipeline')
      setPipeline(res.data.pipeline)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadLeads = async () => {
    try {
      const res = await api.get('/leads')
      setLeads(res.data.leads.filter((l) => l.status !== 'Closed'))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDragStart = (deal, stage) => {
    setDragItem({ ...deal, fromStage: stage })
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleDrop = useCallback(async (targetStage) => {
    if (!dragItem) return
    const fromStage = dragItem.fromStage
    const deals = pipeline[fromStage] || []
    const targetDeals = pipeline[targetStage] || []

    const moved = deals.find((d) => d.id === dragItem.id)
    if (!moved) return

    setPipeline((prev) => ({
      ...prev,
      [fromStage]: (prev[fromStage] || []).filter((d) => d.id !== dragItem.id),
      [targetStage]: [...(prev[targetStage] || []), { ...moved, stage: targetStage }],
    }))

    try {
      await api.put(`/pipeline/${dragItem.id}`, { stage: targetStage })
    } catch (err) {
      console.error(err)
      loadPipeline()
    }

    setDragItem(null)
  }, [dragItem, pipeline])

  const handleCreate = async () => {
    if (!form.lead_id) return
    try {
      await api.post('/pipeline', form)
      setShowModal(false)
      setForm({ lead_id: '', stage: 'Lead', value: '', notes: '' })
      loadPipeline()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (dealId) => {
    if (!confirm('Remove this deal from the pipeline?')) return
    try {
      await api.delete(`/pipeline/${dealId}`)
      loadPipeline()
    } catch (err) {
      console.error(err)
    }
  }

  const stageColors = {
    Lead: { border: 'border-blue-500/30', bg: 'bg-blue-900/10', dot: 'bg-blue-400' },
    Presentation: { border: 'border-purple-500/30', bg: 'bg-purple-900/10', dot: 'bg-purple-400' },
    'Site Visit': { border: 'border-yellow-500/30', bg: 'bg-yellow-900/10', dot: 'bg-yellow-400' },
    Reservation: { border: 'border-orange-500/30', bg: 'bg-orange-900/10', dot: 'bg-orange-400' },
    Contracted: { border: 'border-emerald-500/30', bg: 'bg-emerald-900/10', dot: 'bg-emerald-400' },
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-ms-gold border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm text-ms-muted">Drag deals between stages to update the pipeline</h3>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add to Pipeline
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 min-h-[70vh]">
        {STAGES.map((stage) => {
          const deals = pipeline[stage] || []
          const colors = stageColors[stage] || stageColors.Lead

          return (
            <div
              key={stage}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage)}
              className={`rounded-xl border ${colors.border} ${colors.bg} p-3`}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <h4 className="text-sm font-semibold">{stage}</h4>
                <span className="text-xs text-ms-muted ml-auto">{deals.length}</span>
              </div>

              <div className="space-y-2 min-h-[100px]">
                {deals.length === 0 && (
                  <div className="text-center py-6 text-xs text-ms-muted border border-dashed border-ms-border rounded-lg">
                    Drop deals here
                  </div>
                )}
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal, stage)}
                    className="bg-ms-card border border-ms-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-ms-gold/30 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-ms-muted mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <div>
                          <p className="text-sm font-medium leading-tight">{deal.lead_name}</p>
                          {deal.lead_phone && (
                            <p className="text-xs text-ms-muted flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {deal.lead_phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleDelete(deal.id)}
                        className="text-ms-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-ms-muted">
                      {deal.value && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={10} /> AED {deal.value.toLocaleString()}
                        </span>
                      )}
                      {deal.assigned_name && (
                        <span className="flex items-center gap-1">
                          <User size={10} /> {deal.assigned_name}
                        </span>
                      )}
                    </div>
                    {deal.property_title && (
                      <div className="mt-1.5 text-xs text-ms-gold truncate">{deal.property_title}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-ms-card border border-ms-border rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Add to Pipeline</h3>
              <button onClick={() => setShowModal(false)} className="text-ms-muted hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ms-muted mb-1">Lead *</label>
                <select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })} className="input-field">
                  <option value="">Select lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} {l.phone ? `(${l.phone})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-muted mb-1">Stage</label>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="input-field">
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-muted mb-1">Deal Value (AED)</label>
                <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-ms-muted mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
