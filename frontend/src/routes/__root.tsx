import { Toaster } from 'sonner'
import { Outlet } from '@tanstack/react-router'

export default function Root() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Outlet />
    </div>
  )
}