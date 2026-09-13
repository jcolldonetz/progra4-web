// Módulo de demostración de persistencia en el cliente.
//
// Los 4 modos de sesión que puede usar la app y que se explican en clase:
//   localStorage   - permanente hasta borrar explícitamente (~5-10 MB)
//   sessionStorage - solo mientras la pestaña esté abierta (~5 MB)
//   cookie         - cookie legible/escrita por JS con max-age (~4 KB)
//   cookie_httponly- cookie emitida por la API, ilegible por JS (segura)
//
// El modo elegido se guarda como "preferencia del usuario" en localStorage,
// que es precisamente el caso de uso que ilustra la diapositiva.

export const AUTH_COOKIE_JS = 'progra4_token'
export const AUTH_USER_JS = 'progra4_user'
export const AUTH_MODE_KEY = 'progra4_auth_mode'

// Nombre de la cookie de sesión. Es EL MISMO que usa la API: así se compara en
// clase que "access_token" la puede escribir legible el JS (modo cookie) o
// HttpOnly e ilegible el servidor (modo cookie_httponly), y que en ambos casos
// viaja sola en cada petición HTTP.
export const AUTH_COOKIE_NAME = 'access_token'

export const STORAGE_MODES = [
  { id: 'localStorage', label: 'localStorage', desc: 'Permanente hasta borrarlo (~5–10 MB)' },
  { id: 'sessionStorage', label: 'sessionStorage', desc: 'Solo mientras la pestaña esté abierta (~5 MB)' },
  { id: 'cookie', label: 'Cookie (JS)', desc: 'Legible por JS, vence con max-age (~4 KB)' },
  { id: 'cookie_httponly', label: 'Cookie HttpOnly', desc: 'Ilegible por JS, la emite la API (segura)' },
]

export function getAuthMode() {
  return localStorage.getItem(AUTH_MODE_KEY) || 'localStorage'
}

export function setAuthMode(mode) {
  localStorage.setItem(AUTH_MODE_KEY, mode)
}

// ---------------------------------------------------------------------------
// Cookies desde JS (document.cookie). Una cookie tiene capacidad ~4 KB.
// ---------------------------------------------------------------------------
export function setJsCookie(name, value, maxAgeSeconds = 3600) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}`
}

export function getJsCookie(name) {
  const match = document.cookie.match(
    new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
  )
  return match ? decodeURIComponent(match[1]) : null
}

export function deleteJsCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0`
}

// ---------------------------------------------------------------------------
// Backend de sesión según el modo de persistencia.
// Los modos "cookie" y "localStorage" guardan el token en un lugar legible;
// "cookie_httponly" NO almacena nada en el cliente: la cookie vive en el
// navegador, es ilegible por JS y se envía sola en cada petición HTTP.
// ---------------------------------------------------------------------------
const sessionBackends = {
  localStorage: {
    getToken: () => localStorage.getItem(AUTH_COOKIE_JS),
    setToken: (token) => (token ? localStorage.setItem(AUTH_COOKIE_JS, token) : localStorage.removeItem(AUTH_COOKIE_JS)),
    getUser: () => {
      const raw = localStorage.getItem(AUTH_USER_JS)
      try {
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    setUser: (user) => (user ? localStorage.setItem(AUTH_USER_JS, JSON.stringify(user)) : localStorage.removeItem(AUTH_USER_JS)),
  },
  sessionStorage: {
    getToken: () => sessionStorage.getItem(AUTH_COOKIE_JS),
    setToken: (token) => (token ? sessionStorage.setItem(AUTH_COOKIE_JS, token) : sessionStorage.removeItem(AUTH_COOKIE_JS)),
    getUser: () => {
      const raw = sessionStorage.getItem(AUTH_USER_JS)
      try {
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    setUser: (user) => (user ? sessionStorage.setItem(AUTH_USER_JS, JSON.stringify(user)) : sessionStorage.removeItem(AUTH_USER_JS)),
  },
  cookie: {
    getToken: () => getJsCookie(AUTH_COOKIE_NAME),
    setToken: (token) => (token ? setJsCookie(AUTH_COOKIE_NAME, token, 3600) : deleteJsCookie(AUTH_COOKIE_NAME)),
    // El usuario se guarda en localStorage (solo es metadata de UI, no el token).
    getUser: () => {
      const raw = localStorage.getItem(AUTH_USER_JS)
      try {
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    setUser: (user) => (user ? localStorage.setItem(AUTH_USER_JS, JSON.stringify(user)) : localStorage.removeItem(AUTH_USER_JS)),
  },
  cookie_httponly: {
    // El token no se guarda en el cliente: la cookie HttpOnly la emite la API.
    getToken: () => null,
    setToken: () => {},
    // El usuario se puede guardar como metadata para la UI, pero la sesión
    // real de la cookie_httponly se valida en servidor vía GET /me.
    getUser: () => {
      const raw = localStorage.getItem(AUTH_USER_JS)
      try {
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    setUser: (user) => (user ? localStorage.setItem(AUTH_USER_JS, JSON.stringify(user)) : localStorage.removeItem(AUTH_USER_JS)),
  },
}

export function getSessionBackend() {
  return sessionBackends[getAuthMode()]
}

// Limpia TODOS los almacenes (para desloguear sin importar el modo).
export function clearAllSessions() {
  localStorage.removeItem(AUTH_COOKIE_JS)
  localStorage.removeItem(AUTH_USER_JS)
  sessionStorage.removeItem(AUTH_COOKIE_JS)
  deleteJsCookie(AUTH_COOKIE_NAME)
  deleteJsCookie(AUTH_COOKIE_JS)
}
