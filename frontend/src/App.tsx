import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/layout/Layout'
import Login from './pages/Login'
import Diary from './pages/Diary'
import Stats from './pages/Stats'
import Intestino from './pages/Intestino'
import Biometriche from './pages/Biometriche'
import Impostazioni from './pages/Impostazioni'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Diary />} />
            <Route path="stats" element={<Stats />} />
            <Route path="intestino" element={<Intestino />} />
            <Route path="biometriche" element={<Biometriche />} />
            <Route path="impostazioni" element={<Impostazioni />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1a1d27', border: '1px solid #2a2d3a', color: '#fff' },
          success: { iconTheme: { primary: '#00e5a0', secondary: '#000' } },
        }}
      />
    </QueryClientProvider>
  )
}
