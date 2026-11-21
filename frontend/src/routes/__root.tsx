import { useEffect, useState } from 'react'
import { Link, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'

interface HealthStatus {
  status?: string
  postgresql?: string
  elasticsearch?: string
  storage?: string
}

function HealthIndicator() {
  const [health, setHealth] = useState<HealthStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/health')
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data: HealthStatus) => {
        if (!cancelled) setHealth(data)
      })
      .catch(() => {
        if (!cancelled) setHealth({ status: 'unreachable' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isUp = health?.status === 'ok'
  const label = isUp ? 'Backend OK' : health ? `Backend ${health.status ?? 'unknown'}` : 'Checking…'

  return (
    <span
      data-testid="health-indicator"
      className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${isUp ? 'bg-emerald-600' : 'bg-amber-600'}`}
      />
      {label}
    </span>
  )
}

export default function Root() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <Link
          to="/library"
          search={{ view: 'table', sortField: 'title', sortDir: 'asc' }}
          className="text-lg font-semibold tracking-tight"
        >
          Thebes Public Library
        </Link>
        <HealthIndicator />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
