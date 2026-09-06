const API_BASE = import.meta.env.VITE_API_URL || '/api'

const storage = {
  getToken() {
    return localStorage.getItem('progra4_token')
  },
  setToken(token) {
    if (token) localStorage.setItem('progra4_token', token)
    else localStorage.removeItem('progra4_token')
  },
  getUser() {
    const raw = localStorage.getItem('progra4_user')
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  setUser(user) {
    if (user) localStorage.setItem('progra4_user', JSON.stringify(user))
    else localStorage.removeItem('progra4_user')
  },
}

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors || null
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = storage.getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
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
  items: {
    list() {
      return request('/items')
    },
    get(id) {
      return request(`/items/${id}`)
    },
    create(payload) {
      return request('/items', { method: 'POST', body: payload })
    },
    update(id, payload) {
      return request(`/items/${id}`, { method: 'PUT', body: payload })
    },
    remove(id) {
      return request(`/items/${id}`, { method: 'DELETE' })
    },
  },
}

export { storage }
