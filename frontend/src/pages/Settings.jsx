import { useAuth } from '../context/AuthContext'
import { User, Shield, Mail, Calendar } from 'lucide-react'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl space-y-8">
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-ms-gold/20 flex items-center justify-center text-ms-gold text-2xl font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{user?.full_name || 'User'}</h3>
            <p className="text-sm text-ms-muted capitalize">{user?.role}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <User size={16} className="text-ms-muted" />
            <span className="text-ms-muted w-24">Username</span>
            <span>{user?.username}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-ms-muted" />
            <span className="text-ms-muted w-24">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield size={16} className="text-ms-muted" />
            <span className="text-ms-muted w-24">Role</span>
            <span className="capitalize">{user?.role}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-ms-muted" />
            <span className="text-ms-muted w-24">Member Since</span>
            <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-ms-muted mb-4">About Maison Samaa</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          Maison Samaa is a luxury real estate boutique specializing in premium properties across Dubai.
          This CRM system manages leads, property inventory, and marketing campaigns — all in one place.
        </p>
        <div className="mt-4 p-3 bg-ms-dark border border-ms-border rounded-lg">
          <p className="text-xs text-ms-muted">
            Version 1.0.0 &mdash; Built with React, Flask &amp; SQLite
          </p>
        </div>
      </div>
    </div>
  )
}
