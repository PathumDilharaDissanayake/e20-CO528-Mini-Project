import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('decp_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('decp_token')
      localStorage.removeItem('decp_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export function getApiUrl(path: string): string {
  return `http://localhost:3000/api/v1${path}`
}

const MEDIA_BASE = 'http://localhost:3000'

/** Resolves any image path from the API to a full usable URL */
export function resolveImageUrl(path: string | null | undefined): string | undefined {
  if (!path || typeof path !== 'string') return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return `${MEDIA_BASE}${path}`
  return `${MEDIA_BASE}/uploads/${path}`
}
