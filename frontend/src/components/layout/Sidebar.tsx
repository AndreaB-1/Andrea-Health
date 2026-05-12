import { NavLink } from 'react-router-dom'
import { useThemeStore } from '../../store/themeStore'
import { authApi } from '../../api/endpoints'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { path: '/', icon: '📔', label: 'Diario' },
  { path: '/stats', icon: '📊', label: 'Statistiche' },
  { path: '/intestino', icon: '💧', label: 'Intestino' },
  { path: '/biometriche', icon: '⚖️', label: 'Biometriche' },
  { path: '/impostazioni', icon: '⚙️', label: 'Impostazioni' },
]

export function Sidebar() {
  const { theme, toggleTheme } = useThemeStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { /* ignore */ }
    logout()
    navigate('/login')
    toast.success('Disconnesso')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-[#1a1d27] border-r border-[#2a2d3a] flex flex-col z-50">
      <div className="p-6 border-b border-[#2a2d3a]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌿</span>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">Andrea</h1>
            <p className="text-[#00e5a0] text-xs font-medium">Health</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm
              ${isActive
                ? 'bg-[#00e5a0]/10 text-[#00e5a0] font-medium border border-[#00e5a0]/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'}`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[#2a2d3a] space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/5 text-sm transition-colors"
        >
          <span>🚪</span> Esci
        </button>
      </div>
    </aside>
  )
}
