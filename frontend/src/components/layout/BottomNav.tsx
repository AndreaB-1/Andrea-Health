import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', icon: '📔', label: 'Diario' },
  { path: '/stats', icon: '📊', label: 'Stats' },
  { path: '/intestino', icon: '💧', label: 'Intestino' },
  { path: '/biometriche', icon: '⚖️', label: 'Bio' },
  { path: '/impostazioni', icon: '⚙️', label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1d27] border-t border-[#2a2d3a] flex z-50 md:hidden">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 text-xs transition-colors
            ${isActive ? 'text-[#00e5a0]' : 'text-gray-500'}`
          }
        >
          <span className="text-lg">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
