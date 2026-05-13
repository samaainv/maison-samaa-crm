export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'gold' }) {
  const colors = {
    gold: 'bg-ms-gold/10 text-ms-gold border-ms-gold/20',
    blue: 'bg-blue-900/20 text-blue-400 border-blue-800/20',
    green: 'bg-green-900/20 text-green-400 border-green-800/20',
    purple: 'bg-purple-900/20 text-purple-400 border-purple-800/20',
  }

  return (
    <div className={`card flex items-center gap-4 ${colors[color] || colors.gold}`}>
      {Icon && (
        <div className="p-3 rounded-lg bg-black/30">
          <Icon size={24} />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold">{value ?? '—'}</p>
        <p className="text-sm text-ms-muted">{title}</p>
        {subtitle && <p className="text-xs text-ms-gold mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
