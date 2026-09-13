import {
  getSessionBackend,
  clearAllSessions,
  getAuthMode,
  setAuthMode,
} from '../auth/persistence'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// En los modos de cookie (JS u HttpOnly) el token viaja SOLO en la cookie;
// no se manda Bearer, para que la clase vea que la cookie llega automática.
const usesCookieAuth = () => getAuthMode() === 'cookie' || getAuthMode() === 'cookie_httponly'

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors || null
  }
}

// Helper de sesión que delega en el backend del modo activo.
const session = {
  getToken: () => getSessionBackend().getToken(),
  setToken: (token) => getSessionBackend().setToken(token),
  getUser: () => getSessionBackend().getUser(),
  setUser: (user) => getSessionBackend().setUser(user),
  getMode: getAuthMode,
  setMode: setAuthMode,
  clearAll: clearAllSessions,
}

async function request(path, { method = 'GET', body, auth = true, authFromCookie = false } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  // En los modos de cookie (JS u HttpOnly) el token viaja solo en la cookie:
  // NO se manda la cabecera Authorization, para evidenciarlo en clase.
  const sendBearer = auth && !authFromCookie
  if (sendBearer) {
    const token = session.getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifique que la API esté en ejecución.', 0)
  }

  let data = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    throw new ApiError(data?.error || `Error ${response.status}`, response.status, data?.errors)
  }

  return data
}

export const api = {
  register(payload) {
    return request('/register', { method: 'POST', body: payload, auth: false })
  },
  login(payload) {
    return request('/login', { method: 'POST', body: payload, auth: false })
  },
  me() {
    return request('/me', { authFromCookie: usesCookieAuth() })
  },
  logout() {
    return request('/logout', { method: 'POST', auth: false })
  },
  items: {
    list() {
      return request('/items', { authFromCookie: usesCookieAuth() })
    },
    get(id) {
      return request(`/items/${id}`, { authFromCookie: usesCookieAuth() })
    },
    create(payload) {
      return request('/items', { method: 'POST', body: payload, authFromCookie: usesCookieAuth() })
    },
    update(id, payload) {
      return request(`/items/${id}`, { method: 'PUT', body: payload, authFromCookie: usesCookieAuth() })
    },
    remove(id) {
      return request(`/items/${id}`, { method: 'DELETE', authFromCookie: usesCookieAuth() })
    },
  },
}

export { session }
