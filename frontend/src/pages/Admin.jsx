import { useState, useEffect } from 'react'
import { Check, X, Shield, Clock, User, FileText } from 'lucide-react'
import api from '../api/client'

export default function Admin() {
  const [changes, setChanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [rejectNote, setRejectNote] = useState({})
  const [showReject, setShowReject] = useState(null)

  useEffect(() => { loadChanges() }, [filter])

  const loadChanges = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/pending', { params: { status: filter } })
      setChanges(res.data.changes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/pending/${id}/approve`)
      loadChanges()
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/pending/${id}/reject`, { review_note: rejectNote[id] || '' })
      setShowReject(null)
      loadChanges()
    } catch (err) {
      console.error(err)
    }
  }

  const entityIcons = {
    property: '🏠',
    lead: '👤',
    deal: '💼',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-ms-gold" />
          <h3 className="text-sm text-ms-muted">Review and approve pending changes</h3>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === s ? 'bg-ms-gold/10 text-ms-gold border border-ms-gold/20' : 'text-ms-muted hover:text-white border border-transparent'
              }`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-ms-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : changes.length === 0 ? (
        <div className="card text-center py-12">
          <FileText size={40} className="text-ms-border mx-auto mb-3" />
          <p className="text-ms-muted">No {filter} changes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map((c) => (
            <div key={c.id} className="card flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg">{entityIcons[c.entity_type] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-ms-dark border border-ms-border text-xs capitalize">{c.entity_type}</span>
                    <span className="text-xs text-ms-muted">#{c.entity_id}</span>
                    <span className="text-xs font-medium">{c.field_name}</span>
                  </div>
                  <div className="mt-1.5 text-sm flex items-center gap-3 flex-wrap">
                    <span className="text-red-400 line-through">{c.old_value || '(empty)'}</span>
                    <span className="text-ms-muted">→</span>
                    <span className="text-green-400 font-medium">{c.new_value}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-ms-muted">
                    <span className="flex items-center gap-1"><User size={12} /> {c.submitted_name || 'Unknown'}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(c.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {c.status === 'pending' ? (
                  <>
                    <button onClick={() => handleApprove(c.id)}
                      className="px-4 py-2 bg-green-900/30 text-green-300 border border-green-800/30 rounded-lg text-sm font-medium hover:bg-green-900/50 transition-colors flex items-center gap-1.5">
                      <Check size={16} /> Approve
                    </button>
                    <button onClick={() => setShowReject(showReject === c.id ? null : c.id)}
                      className="px-4 py-2 bg-red-900/30 text-red-300 border border-red-800/30 rounded-lg text-sm font-medium hover:bg-red-900/50 transition-colors flex items-center gap-1.5">
                      <X size={16} /> Reject
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`badge badge-${c.status} text-xs capitalize`}>{c.status}</span>
                    {c.reviewer_name && <span className="text-xs text-ms-muted">by {c.reviewer_name}</span>}
                  </div>
                )}
              </div>

              {showReject === c.id && (
                <div className="w-full flex items-center gap-2">
                  <input type="text" placeholder="Reason for rejection..."
                    value={rejectNote[c.id] || ''}
                    onChange={(e) => setRejectNote({ ...rejectNote, [c.id]: e.target.value })}
                    className="input-field flex-1" />
                  <button onClick={() => handleReject(c.id)}
                    className="btn-danger text-sm">Confirm Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
