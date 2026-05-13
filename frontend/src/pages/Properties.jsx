import { useState, useEffect } from 'react'
import { Plus, Search, X, DollarSign, MapPin, Home, Maximize } from 'lucide-react'
import api from '../api/client'
import DataTable from '../components/DataTable'

const projects = ['Zahw', 'Taj City', 'Origami']
const unitTypes = ['Studio', '1BR', '2BR', '3BR', 'Villa', 'Penthouse', 'Commercial']
const avStatuses = ['Available', 'Reserved', 'Sold']

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [form, setForm] = useState({
    title: '', project_name: '', unit_type: '', property_type: '', status: 'Available',
    price: '', area_sqm: '', bedrooms: '', bathrooms: '', location: '', city: 'Dubai',
    description: '', features: '', images: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadProperties() }, [])

  const loadProperties = async () => {
    setLoading(true)
    const params = {}
    if (statusFilter) params.status = statusFilter
    if (projectFilter) params.project_name = projectFilter
    if (search) params.search = search
    try {
      const res = await api.get('/properties', { params })
      setProperties(res.data.properties)
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
        price: parseFloat(form.price),
        area_sqm: form.area_sqm ? parseFloat(form.area_sqm) : undefined,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        features: form.features ? form.features.split(',').map((f) => f.trim()) : [],
        images: form.images ? form.images.split(',').map((i) => i.trim()) : [],
      }
      if (form.id) {
        await api.put(`/properties/${form.id}`, payload)
      } else {
        await api.post('/properties', payload)
      }
      setShowModal(false)
      resetForm()
      loadProperties()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (prop) => {
    setForm({
      ...prop,
      price: prop.price || '',
      area_sqm: prop.area_sqm || '',
      bedrooms: prop.bedrooms || '',
      bathrooms: prop.bathrooms || '',
      features: Array.isArray(prop.features) ? prop.features.join(', ') : prop.features || '',
      images: Array.isArray(prop.images) ? prop.images.join(', ') : prop.images || '',
    })
    setShowModal(true)
  }

  const deleteProp = async (id) => {
    if (!confirm('Delete this property?')) return
    await api.delete(`/properties/${id}`)
    setShowDetail(null)
    loadProperties()
  }

  const resetForm = () => {
    setForm({
      title: '', project_name: '', unit_type: '', property_type: '', status: 'Available',
      price: '', area_sqm: '', bedrooms: '', bathrooms: '', location: '', city: 'Dubai',
      description: '', features: '', images: '',
    })
  }

  const columns = [
    { key: 'title', label: 'Title', render: (r) => <span className="font-medium truncate max-w-[180px] block">{r.title}</span> },
    { key: 'project_name', label: 'Project' },
    { key: 'unit_type', label: 'Unit' },
    { key: 'price', label: 'Price', render: (r) => <span className="text-ms-gold font-medium">AED {r.price?.toLocaleString()}</span> },
    { key: 'bedrooms', label: 'Beds', render: (r) => r.bedrooms ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <span className={`badge badge-${r.status}`}>{r.status}</span> },
  ]

  const FilterBtn = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-ms-gold/10 text-ms-gold border border-ms-gold/20' : 'text-ms-muted hover:text-white border border-transparent'
      }`}>{label}</button>
  )

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ms-muted" size={16} />
            <input type="text" placeholder="Search..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadProperties()}
              className="input-field pl-10 pr-4 w-56" />
          </div>
          <select value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setTimeout(loadProperties, 0) }}
            className="input-field w-32 text-xs">
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Property
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <FilterBtn label="All" active={!statusFilter} onClick={() => { setStatusFilter(''); loadProperties() }} />
        {avStatuses.map((s) => (
          <FilterBtn key={s} label={s} active={statusFilter === s}
            onClick={() => { setStatusFilter(s); loadProperties() }} />
        ))}
      </div>

      <div className="card p-0 overflow-x-auto">
        <DataTable columns={columns} data={properties} onRowClick={setShowDetail} />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-ms-card border border-ms-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{form.id ? 'Edit Property' : 'New Property'}</h3>
              <button onClick={() => setShowModal(false)} className="text-ms-muted hover:text-white"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Project</label>
                <select value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} className="input-field">
                  <option value="">Select</option>
                  {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Unit Type</label>
                <select value={form.unit_type} onChange={(e) => setForm({ ...form, unit_type: e.target.value })} className="input-field">
                  <option value="">Select</option>
                  {unitTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  {avStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Price (AED) *</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Area (sqm)</label>
                <input type="number" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Bedrooms</label>
                <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Bathrooms</label>
                <input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-ms-muted mb-1">City</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Features (comma separated)</label>
                <input type="text" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="input-field" /></div>
              <div className="col-span-2"><label className="block text-xs font-medium text-ms-muted mb-1">Image URLs (comma separated)</label>
                <input type="text" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="input-field" /></div>
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
              <h3 className="text-lg font-semibold">{showDetail.title}</h3>
              <button onClick={() => setShowDetail(null)} className="text-ms-muted hover:text-white"><X size={20} /></button>
            </div>
            {showDetail.images?.[0] && (
              <img src={showDetail.images[0]} alt={showDetail.title}
                className="w-full h-40 object-cover rounded-lg mb-4" />
            )}
            <div className="space-y-3 mb-6">
              <div className="flex gap-2 flex-wrap">
                <span className={`badge badge-${showDetail.status}`}>{showDetail.status}</span>
                {showDetail.project_name && <span className="badge bg-ms-gold/10 text-ms-gold">{showDetail.project_name}</span>}
                {showDetail.unit_type && <span className="badge bg-ms-dark border border-ms-border">{showDetail.unit_type}</span>}
              </div>
              <div className="flex items-center gap-2 text-sm"><DollarSign size={16} className="text-ms-gold" /> AED {showDetail.price?.toLocaleString()}</div>
              <div className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-ms-muted" /> {showDetail.location || showDetail.city || '—'}</div>
              {showDetail.bedrooms !== null && <div className="text-sm"><span className="text-ms-muted">{showDetail.bedrooms ?? '—'} Bed / {showDetail.bathrooms ?? '—'} Bath</span></div>}
              <div className="flex items-center gap-2 text-sm"><Maximize size={16} className="text-ms-muted" /> {showDetail.area_sqm ? `${showDetail.area_sqm} sqm` : '—'}</div>
              <div className="flex items-center gap-2 text-sm"><Home size={16} className="text-ms-muted" /> Listed by: {showDetail.listed_by_name || '—'}</div>
              {showDetail.description && <div className="text-sm">{showDetail.description}</div>}
              {showDetail.features?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {showDetail.features.map((f, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs bg-ms-dark border border-ms-border rounded-md">{f}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => openEdit(showDetail)} className="btn-secondary text-sm">Edit</button>
              <button onClick={() => deleteProp(showDetail.id)} className="btn-danger text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
