import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { api, ApiError } from '../api/client'
import {
  STORAGE_MODES,
  AUTH_COOKIE_JS,
  AUTH_COOKIE_NAME,
  getAuthMode,
  getJsCookie,
  setJsCookie,
  deleteJsCookie,
  clearAllSessions,
} from '../auth/persistence'

const emptyLogs = { local: [], session: [], cookie: [] }

function snapshotStore() {
  const local = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i)
    local.push({ key, value: localStorage.getItem(key) })
  }
  const session = []
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i)
    session.push({ key, value: sessionStorage.getItem(key) })
  }
  return {
    local: local.sort((a, b) => a.key.localeCompare(b.key)),
    session: session.sort((a, b) => a.key.localeCompare(b.key)),
    cookies: document.cookie,
  }
}

const FIELDS = [
  {
    title: 'localStorage',
    capacidad: '~5–10 MB por origen',
    duracion: 'Permanente hasta que se borre explícitamente',
    acceso: 'Solo JavaScript del mismo origen',
    uso: 'Preferencias del usuario, tema, idioma, tokens no críticos',
  },
  {
    title: 'sessionStorage',
    capacidad: '~5 MB por origen',
    duracion: 'Solo mientras la pestaña esté abierta (se borra al cerrarla)',
    acceso: 'Solo JavaScript, solo la pestaña actual',
    uso: 'Datos temporales de un flujo de varios pasos (wizard, formulario multipágina)',
  },
  {
    title: 'Cookies',
    capacidad: '~4 KB por cookie',
    duracion: 'Configurable con expires / max-age',
    acceso: 'JavaScript (si no tiene HttpOnly) y el servidor en cada petición HTTP',
    uso: 'Autenticación segura con flags HttpOnly, Secure y SameSite',
  },
]

export default function StorageDemo() {
  const { user } = useAuth()
  const [state, setState] = useState(() => snapshotStore())
  const [logs, setLogs] = useState(emptyLogs)
  const [meResult, setMeResult] = useState(null)
  const [meError, setMeError] = useState(null)

  const refresh = useCallback(() => setState(snapshotStore()), [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [refresh])

  const run = (section, code) => {
    setLogs((prev) => ({ ...prev, [section]: [code, ...prev[section]].slice(0, 6) }))
  }

  // ---- Ejemplos idénticos a la diapositiva ----
  const demoLocalStorage = () => {
    localStorage.setItem('tema', 'oscuro')
    run('local', "localStorage.setItem('tema', 'oscuro');")
    refresh()
  }
  const demoLocalRead = () => {
    const tema = localStorage.getItem('tema')
    run('local', `const tema = localStorage.getItem('tema');  // -> "${tema ?? 'null'}"`)
  }
  const demoLocalRemove = () => {
    localStorage.removeItem('tema')
    run('local', "localStorage.removeItem('tema');")
    refresh()
  }

  const demoSessionSave = () => {
    sessionStorage.setItem('paso', '2')
    run('session', "sessionStorage.setItem('paso', '2');")
    refresh()
  }
  const demoSessionRead = () => {
    const paso = sessionStorage.getItem('paso')
    run('session', `const paso = sessionStorage.getItem('paso');  // -> "${paso ?? 'null'}"`)
  }
  const demoSessionRemove = () => {
    sessionStorage.removeItem('paso')
    run('session', "sessionStorage.removeItem('paso');")
    refresh()
  }

  const demoCookieSave = () => {
    setJsCookie('tema', 'oscuro', 3600)
    run('cookie', "document.cookie = 'tema=oscuro; Path=/; Max-Age=3600';")
    refresh()
  }
  const demoCookieRead = () => {
    const tema = getJsCookie('tema')
    run('cookie', `const tema = getJsCookie('tema');  // -> "${tema ?? 'null'}"`)
  }
  const demoCookieRemove = () => {
    deleteJsCookie('tema')
    run('cookie', "document.cookie = 'tema=; Path=/; Max-Age=0';")
    refresh()
  }
  const demoCookieRaw = () => {
    run('cookie', `document.cookie  // -> "${state.cookies || '(vacía)'}"`)
  }

  const checkHttpOnly = async () => {
    setMeError(null)
    setMeResult(null)
    try {
      const data = await api.me()
      setMeResult(data.user)
    } catch (err) {
      if (err instanceof ApiError) setMeError(err.message)
      else setMeError('Error de red o la cookie no es válida.')
    }
  }

  const wipeAll = async () => {
    if (
      !window.confirm(
        'Se limpiarán localStorage, sessionStorage y cookies del sitio. Si el modo actual es cookie HttpOnly, también se cerrará la sesión en el servidor. ¿Continuar?'
      )
    ) {
      return
    }
    try {
      if (getAuthMode() === 'cookie_httponly') {
        await api.logout().catch(() => {})
      }
    } finally {
      clearAllSessions()
      setMeResult(null)
      setMeError(null)
      refresh()
    }
  }

  const currentMode = getAuthMode()
  const tokenInLs = localStorage.getItem(AUTH_COOKIE_JS)
  const tokenInSs = sessionStorage.getItem(AUTH_COOKIE_JS)
  const tokenInJsCookie = getJsCookie(AUTH_COOKIE_NAME)

  return (
    <div className="page page-wide">
      <div className="page-header">
        <h2>Persistencia en el cliente</h2>
      </div>

      <div className="demo-banner">
        <p>
          El <strong>estado en memoria</strong> se pierde al cerrar o recargar la pestaña. El navegador
          ofrece varias opciones de almacenamiento con distintas características, capacidades y casos de
          uso. Úsalas desde esta página para ver cómo se comportan en vivo.
        </p>
        <p className="demo-warn">
          Nunca almacenes tokens de acceso o datos sensibles en localStorage si la seguridad es crítica:
          un ataque XSS puede leer todo su contenido. Para autenticación robusta, usa cookies con la flag{' '}
          <code>HttpOnly</code>.
        </p>
      </div>

      <div className="mode-summary">
        <span className="mode-summary-label">Modo de sesión actual:</span>
        <span className="mode-summary-value">
          {STORAGE_MODES.find((m) => m.id === currentMode)?.label ?? currentMode}
        </span>
        <span className="mode-summary-note">
          {user ? `Sesión activa de ${user.username}` : 'Sin sesión activa'}
        </span>
      </div>

      <div className="token-locus">
        {currentMode === 'localStorage' && (
          <span>Token en localStorage: {tokenInLs ? 'presente ✓' : 'ausente'}</span>
        )}
        {currentMode === 'sessionStorage' && (
          <span>Token en sessionStorage: {tokenInSs ? 'presente ✓' : 'ausente'}</span>
        )}
        {currentMode === 'cookie' && (
          <span>
            Token en cookie JS (<code>access_token</code>):{' '}
            {tokenInJsCookie ? 'presente ✓ (legible y viaja sola)' : 'ausente'}
          </span>
        )}
        {currentMode === 'cookie_httponly' && (
          <span>
            Token en cookie HttpOnly: emitida por la API, <strong>no visible desde JS</strong> — validar
            con <code>GET /me</code>.
          </span>
        )}
      </div>

      <div className="demo-grid">
        <div className="demo-card">
          <h3>localStorage</h3>
          <ul className="demo-legend">
            <li><strong>Capacidad:</strong> {FIELDS[0].capacidad}</li>
            <li><strong>Duración:</strong> {FIELDS[0].duracion}</li>
            <li><strong>Acceso:</strong> {FIELDS[0].acceso}</li>
            <li><strong>Uso ideal:</strong> {FIELDS[0].uso}</li>
          </ul>
          <div className="demo-buttons">
            <button className="btn btn-small" onClick={demoLocalStorage}>Guardar tema→oscuro</button>
            <button className="btn btn-small btn-secondary" onClick={demoLocalRead}>Leer</button>
            <button className="btn btn-small btn-danger" onClick={demoLocalRemove}>Eliminar</button>
          </div>
          <pre className="demo-code">{logs.local.join('\n') || '// Acción pendiente'}</pre>
          <div className="demo-values">
            {state.local.length === 0 && <em>Sin claves guardadas.</em>}
            {state.local.map(({ key, value }) => (
              <p key={key}><code>{key}</code> = <code>{value}</code></p>
            ))}
          </div>
        </div>

        <div className="demo-card">
          <h3>sessionStorage</h3>
          <ul className="demo-legend">
            <li><strong>Capacidad:</strong> {FIELDS[1].capacidad}</li>
            <li><strong>Duración:</strong> {FIELDS[1].duracion}</li>
            <li><strong>Acceso:</strong> {FIELDS[1].acceso}</li>
            <li><strong>Uso ideal:</strong> {FIELDS[1].uso}</li>
          </ul>
          <div className="demo-buttons">
            <button className="btn btn-small" onClick={demoSessionSave}>Guardar paso→2</button>
            <button className="btn btn-small btn-secondary" onClick={demoSessionRead}>Leer</button>
            <button className="btn btn-small btn-danger" onClick={demoSessionRemove}>Eliminar</button>
          </div>
          <pre className="demo-code">{logs.session.join('\n') || '// Acción pendiente'}</pre>
          <div className="demo-values">
            {state.session.length === 0 && <em>Sin claves guardadas.</em>}
            {state.session.map(({ key, value }) => (
              <p key={key}><code>{key}</code> = <code>{value}</code></p>
            ))}
          </div>
        </div>

        <div className="demo-card">
          <h3>Cookies</h3>
          <ul className="demo-legend">
            <li><strong>Capacidad:</strong> {FIELDS[2].capacidad}</li>
            <li><strong>Duración:</strong> {FIELDS[2].duracion}</li>
            <li><strong>Acceso:</strong> {FIELDS[2].acceso}</li>
            <li><strong>Uso ideal:</strong> {FIELDS[2].uso}</li>
          </ul>
          <div className="demo-buttons">
            <button className="btn btn-small" onClick={demoCookieSave}>Guardar (max-age)</button>
            <button className="btn btn-small btn-secondary" onClick={demoCookieRead}>Leer</button>
            <button className="btn btn-small btn-danger" onClick={demoCookieRemove}>Borrar (max-age=0)</button>
          </div>
          <pre className="demo-code">{logs.cookie.join('\n') || '// Acción pendiente'}</pre>
          <div className="demo-values">
            <p><button className="btn btn-small" onClick={demoCookieRaw}>Ver document.cookie</button></p>
            <code className="cookie-raw">{state.cookies || '(sin cookies legibles por JS)'}</code>
          </div>
        </div>
      </div>

      <div className="demo-httponly">
        <h3>Cookie HttpOnly (autenticación robusta)</h3>
        <p>
          La API puede emitir el token en una cookie <code>HttpOnly</code> al iniciar sesión. El navegador
          la manda sola en cada petición, pero JavaScript no puede leerla (no aparece en{' '}
          <code>document.cookie</code>). Solo el servidor puede borrarla con <code>POST /logout</code>.
        </p>
        <button className="btn btn-small" onClick={checkHttpOnly}>Comprobar sesión (GET /me)</button>
        <div className="demo-values">
          {meResult && <p className="ok">Sesión válida: {meResult.username} (id {meResult.id})</p>}
          {meError && <p className="err">{meError}</p>}
          {!meResult && !meError && <em>Pulsa el botón para validar la cookie contra el servidor.</em>}
        </div>
      </div>

      <div className="demo-wipe">
        <button className="btn btn-danger" onClick={wipeAll}>Limpiar todos los almacenes</button>
        <span className="demo-wipe-note">Borra localStorage, sessionStorage y cookies de este origen.</span>
      </div>
    </div>
  )
}