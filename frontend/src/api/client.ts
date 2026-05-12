import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true
      isRefreshing = true
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        isRefreshing = false
        return api(original)
      } catch {
        isRefreshing = false
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
