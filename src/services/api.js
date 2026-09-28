const API_BASE = import.meta.env.VITE_API_URL || '/api'

/*
 * SESIÓN DEL NAVEGADOR: una cache en memoria con respaldo en localStorage.
 *
 * Por qué la cache (lección importante): dos ventanas del MISMO perfil —por
 * ejemplo dos ventanas de incógnito, o dos pestañas— comparten el mismo
 * localStorage. Si cada request leyera el token de ahí, la ventana que en
 * pantalla es "cliente1" podría enviar el token que otra ventana escribió
 * ("cliente2"): el backend atribuiría el pedido al usuario equivocado y los
 * toasts realtime mostrarían el nombre que no corresponde.
 *
 * Con la cache, cada ventana conserva SU sesión durante toda su vida: lo que
 * se ve en pantalla es exactamente el token que viaja en cada request y en el
 * WebSocket. Al recargar la página se vuelve a leer de localStorage (gana la
 * última sesión escrita). Para tener dos usuarios REALMENTE simultáneos en el
 * mismo equipo, usá perfiles/particiones distintas: una ventana normal + una
 * de incógnito (o dos navegadores).
 */
const TOKEN_KEY = 'progra4_token'
const USER_KEY = 'progra4_user'

let currentToken = localStorage.getItem(TOKEN_KEY)
let currentUser = readUser(localStorage.getItem(USER_KEY))

function readUser(raw) {
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const storage = {
  getToken() {
    return currentToken
  },
  setToken(token) {
    currentToken = token || null
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  },
  getUser() {
    return currentUser
  },
  setUser(user) {
    currentUser = user || null
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
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

  // Pedidos (usa /pedidos)
  pedidos: {
    list() {
      // GET /pedidos -> 200 [Pedido]
      return request('/pedidos').then(normalizeCollection)
    },
    create(payload) {
      // POST /pedidos -> 201 { pedido, item, username } | 404 | 422
      return request('/pedidos', { method: 'POST', body: payload })
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