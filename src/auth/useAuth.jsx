import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../api/client'
import {
  getAuthMode,
  setAuthMode,
  clearAllSessions,
  getSessionBackend,
} from './persistence'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSessionBackend().getUser())
  const [token, setToken] = useState(() => getSessionBackend().getToken())
  const [mode, setMode] = useState(() => getAuthMode())

  const applySession = useCallback((data, selectedMode) => {
    setAuthMode(selectedMode)
    const backend = getSessionBackend()
    // En el modo HttpOnly el token NO se guarda en el cliente (la cookie la
    // emite la API); en los demás se persiste según el modo elegido.
    backend.setToken(data.token)
    backend.setUser(data.user)
    setMode(selectedMode)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const login = useCallback(
    async (payload, selectedMode) => {
      const wantsCookie = selectedMode === 'cookie_httponly'
      const body = wantsCookie ? { ...payload, auth_cookie: true } : payload
      const data = await api.login(body)
      applySession(data, selectedMode)
      return data.user
    },
    [applySession]
  )

  const register = useCallback(
    async (payload, selectedMode) => {
      const wantsCookie = selectedMode === 'cookie_httponly'
      const body = wantsCookie ? { ...payload, auth_cookie: true } : payload
      const data = await api.register(body)
      applySession(data, selectedMode)
      return data.user
    },
    [applySession]
  )

  // En el modo HttpOnly la cookie se borra del lado del servidor (POST /logout).
  const logout = useCallback(async () => {
    if (getAuthMode() === 'cookie_httponly') {
      try {
        await api.logout()
      } catch {
        // Si la API no responde, igual limpiamos el estado local.
      }
    }
    clearAllSessions()
    setToken(null)
    setUser(null)
  }, [])

  // Al cargar: si quedamos en modo HttpOnly y no hay token en memoria (caso de
  // recarga), reconstruimos la sesión consultando GET /me: la cookie HttpOnly
  // viaja sola con la petición y el servidor valida si sigue vigente.
  useEffect(() => {
    if (mode !== 'cookie_httponly' || token) return
    let active = true
    api
      .me()
      .then((data) => {
        if (!active) return
        setUser(data.user)
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        clearAllSessions()
      })
    return () => {
      active = false
    }
  }, [mode, token])

  const value = {
    user,
    token,
    mode,
    isAuthenticated: mode === 'cookie_httponly' ? Boolean(user) : Boolean(token),
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
