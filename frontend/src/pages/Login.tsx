import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, setToken } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const resp = await authApi.login(username, password)
      setToken(resp.data.access_token)
      const me = await authApi.me()
      setUser(me.data)
      navigate('/')
      toast.success('Benvenuto!')
    } catch {
      toast.error('Credenziali non valide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🌿</span>
          <h1 className="text-2xl font-bold text-white mt-3">Andrea Health</h1>
          <p className="text-gray-400 text-sm mt-1">Diario personale di benessere</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="andrea"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-white
                placeholder-gray-600 focus:outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-white
                placeholder-gray-600 focus:outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00e5a0] text-black font-semibold py-2.5 rounded-lg
              hover:bg-[#00c88e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}
