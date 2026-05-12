import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="md:ml-[220px] p-4 md:p-6 pb-20 md:pb-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
