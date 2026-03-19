import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../api'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('decp_token')
    const savedUser = localStorage.getItem('decp_user')

    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        // Verify token is still valid
        api.get('/auth/me')
          .then((res) => {
            const u = res.data?.data?.user || res.data?.data || res.data?.user || res.data
            if (u?.id || u?._id) {
              const normalized = { ...u, id: u._id || u.id }
              setUser(normalized)
              localStorage.setItem('decp_user', JSON.stringify(normalized))
            }
          })
          .catch(() => {
            // Token expired — clear
            localStorage.removeItem('decp_token')
            localStorage.removeItem('decp_user')
            setToken(null)
            setUser(null)
          })
          .finally(() => setIsLoading(false))
      } catch {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    // API returns { success, data: { user, accessToken, refreshToken } }
    const payload = res.data?.data || res.data
    const resolvedToken = payload?.accessToken || payload?.access_token || payload?.token
    const resolvedUser = payload?.user || payload

    if (!resolvedToken) throw new Error('No token returned from server')

    localStorage.setItem('decp_token', resolvedToken)
    localStorage.setItem('decp_user', JSON.stringify(resolvedUser))
    setToken(resolvedToken)
    setUser(resolvedUser)
  }

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data)
    const payload = res.data?.data || res.data
    const resolvedToken = payload?.accessToken || payload?.access_token || payload?.token
    const resolvedUser = payload?.user || payload

    if (resolvedToken) {
      localStorage.setItem('decp_token', resolvedToken)
      localStorage.setItem('decp_user', JSON.stringify(resolvedUser))
      setToken(resolvedToken)
      setUser(resolvedUser)
    }
  }

  const logout = () => {
    localStorage.removeItem('decp_token')
    localStorage.removeItem('decp_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
