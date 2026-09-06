import { createContext, useContext, useState, useCallback } from 'react'
import { api, storage } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.getUser())
  const [token, setToken] = useState(() => storage.getToken())

  const login = useCallback(async (payload) => {
    const data = await api.login(payload)
    storage.setToken(data.token)
    storage.setUser(data.user)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const data = await api.register(payload)
    storage.setToken(data.token)
    storage.setUser(data.user)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    storage.setToken(null)
    storage.setUser(null)
    setToken(null)
    setUser(null)
  }, [])

  const value = { user, token, isAuthenticated: Boolean(token), login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
