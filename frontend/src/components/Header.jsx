import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/properties': 'Properties',
  '/marketing': 'Marketing',
  '/settings': 'Settings',
}

export default function Header() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Maison Samaa'

  return (
    <header className="h-16 bg-ms-darker border-b border-ms-border flex items-center justify-between px-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-ms-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
    </header>
  )
}
