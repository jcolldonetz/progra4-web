const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const storage = {
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

/** Normaliza una colección: el backend responde un array plano; el frontend
 * espera { data, meta } para mostrar paginación (meta null = sin paginar). */
function normalizeCollection(data) {
  if (Array.isArray(data)) return { data, meta: null }
  return data ?? { data: [], meta: null }
}

/** Construye "?page=2&per_page=10" a partir de un objeto; omite vacíos. */
function toQuery(params) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, value)
  }
  const str = qs.toString()
  return str ? `?${str}` : ''
}

/**
 * Ejecuta una petición contra la API descrita en openapi.yaml.
 * Añade el header Authorization: Bearer <jwt> cuando auth = true.
 */
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
  // Auth
  login(payload) {
    // POST /login -> 200 TokenResponse | 401 | 422
    return request('/login', { method: 'POST', body: payload, auth: false })
  },
  register(payload) {
    // POST /register -> 201 TokenResponse | 422
    return request('/register', { method: 'POST', body: payload, auth: false })
  },

  // Items (usa /items y /items/{id})
  items: {
    list(params) {
      // GET /items?page=&per_page= -> 200 { data, meta } | 422
      return request(`/items${toQuery(params)}`).then(normalizeCollection)
    },
    get(id) {
      // GET /items/{id} -> 200 Item | 404 | 422
      return request(`/items/${id}`)
    },
    create(payload) {
      // POST /items -> 201 Item | 422
      return request('/items', { method: 'POST', body: payload })
    },
    update(id, payload) {
      // PUT /items/{id} -> 200 Item | 404 | 422
      return request(`/items/${id}`, { method: 'PUT', body: payload })
    },
    remove(id) {
      // DELETE /items/{id} -> 204 | 404 | 422
      return request(`/items/${id}`, { method: 'DELETE' })
    },
  },

  // Categorias (usa /categorias, /categorias/{id} y /categorias/{id}/items)
  categorias: {
    list() {
      // GET /categorias -> 200 [Categoria] (cada una con items_count)
      return request('/categorias')
    },
    get(id) {
      // GET /categorias/{id} -> 200 Categoria | 404 | 422
      return request(`/categorias/${id}`)
    },
    items(id, params) {
      // GET /categorias/{id}/items?page=&per_page= -> 200 { data, meta } | 404 | 422
      return request(`/categorias/${id}/items${toQuery(params)}`).then(normalizeCollection)
    },
    create(payload) {
      // POST /categorias -> 201 Categoria | 422
      return request('/categorias', { method: 'POST', body: payload })
    },
    update(id, payload) {
      // PUT /categorias/{id} -> 200 Categoria | 404 | 422
      return request(`/categorias/${id}`, { method: 'PUT', body: payload })
    },
    remove(id) {
      // DELETE /categorias/{id} -> 204 | 404 | 422
      return request(`/categorias/${id}`, { method: 'DELETE' })
    },
  },
}