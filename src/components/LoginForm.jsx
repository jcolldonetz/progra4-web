// =============================================================================
// LoginForm.jsx — FORMULARIO DE LOGIN (usuario + contraseña).
//
// Componente reutilizable que hace tres cosas:
//   1) Dibuja el formulario (inputs y botón) en HTML/JSX.
//   2) "Recuerda" lo que el usuario va escribiendo (para eso sirven los
//      "estados" de useState).
//   3) Al enviar, llama a la API (POST /login) con las credenciales y muestra
//      los errores que la API devuelva (por campo o generales).
//
// No sabe qué ocurre DESPUÉS de un login exitoso: se lo informa a la página
// padre mediante la propiedad onSuccess, y la página decide a dónde navegar.
//
// Flujo completo del login (para leer de arriba a abajo):
//   usuario escribe  -> handleChange guarda el texto en "form"
//   usuario envía    -> handleSubmit llama a "login(form)" (capa services/api.js)
//   la API responde  -> o bien la sesión se guarda y se avisa con onSuccess(),
//                       o bien se muestra un error (global o por campo).
// =============================================================================

import { useState } from 'react'            // hook para crear "estado" en el componente
import { useAuth } from '../stores/authStore' // store central de la sesión
import { ApiError } from '../services/api'    // clase de error que lanza la capa de API

// Componente auxiliar: muestra un error GENERAL (ej. "Credenciales inválidas").
// "children" es el contenido que el padre pone entre las etiquetas.
// Si no hay error (children viene vacío) no dibuja nada.
function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

// Componente auxiliar: muestra el error de un CAMPO concreto (ej. "password").
// "errors" es un mapa de la API: { nombreDelCampo: ['mensaje de error', ...] }.
function FieldError({ field, errors }) {
  if (!field || !errors || !errors[field]) return null
  return <div className="field-error">{errors[field].join(', ')}</div>
}

// Componente principal. Recibe "props" (propiedades): datos que la página padre
// le pasa entre llaves, aquí únicamente "onSuccess" (función opcional que se
// ejecuta cuando el login es exitoso).
export default function LoginForm({ onSuccess }) {
  // "login" es la función del store que llama a la API (services/api.js),
  // guarda el token y el usuario en la sesión y avisa a toda la app.
  const { login } = useAuth()

  // useState crea una "CAJA DE MEMORIA" del componente:
  //   const [valor, setValor] = useState(initial)  ->  valor = estado actual
  //                                                   setValor = función para cambiarlo
  // Cada vez que se llama a setValor, React vuelve a dibujar el componente
  // con el nuevo valor. Esos son los 4 estados de este formulario:
  const [form, setForm] = useState({ username: '', password: '' }) // lo escrito en los inputs
  const [errors, setErrors] = useState(null)        // errores POR CAMPO de la API
  const [globalError, setGlobalError] = useState(null) // error GENERAL de la API
  const [loading, setLoading] = useState(false)     // true mientras se envía la petición

  // Maneja el evento "cada vez que el usuario escribe en un campo".
  //  - e.target = el <input> que disparó el evento.
  //  - e.target.name  = atributo "name" del input ("username" o "password").
  //  - e.target.value = el texto que contiene ahora el input.
  // Se copia el estado anterior (...) y se actualiza SOLO el campo que cambió.
  // Renderizar el input con value={form.x} hace que el estado sea la única
  // fuente de verdad (input "controlado" por React).
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Maneja el evento "se envió el formulario" (botón Ingresar o tecla Enter).
  // Es una función "async": puede llamar a la API y ESPERAR su respuesta con
  // "await" sin bloquear el navegador.
  const handleSubmit = async (e) => {
    e.preventDefault() // evita la recarga nativa de la página que hace un <form> HTML
    setErrors(null) // se limpian errores anteriores en cada nuevo intento
    setGlobalError(null)
    setLoading(true) // marca "enviando...": desactiva el botón (evita doble envío)

    try {
      await login(form) // 1) Petición POST /login con {username, password}.
                        //    Si falla, el "await" lanza una excepción -> al catch.
      onSuccess?.()     // 2) Éxito: se avisa a la página padre ("?." = solo si se pasó onSuccess).
    } catch (err) {
      // 3) La API respondió con error. Hay dos tipos:
      //    - ApiError con .errors  -> errores POR CAMPO (respuesta HTTP 422 de validación).
      //    - cualquier otro        -> error GLOBAL (p. ej. 401 "Credenciales inválidas").
      if (err instanceof ApiError && err.errors) setErrors(err.errors)
      else setGlobalError(err.message)
    } finally {
      setLoading(false) // 4) Pase lo que pase, se deja de "cargar".
    }
  }

  // JSX: la "pintura" del componente (HTML con lógica mezclada).
  // Cada input está "controlado": value = estado actual y onChange = manejador;
  // así, cada tecla actualiza el estado y React vuelve a pintar con lo vigente.
  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <h1 className="auth-title">Iniciar sesión</h1>
      <p className="auth-subtitle">Bienvenido a tu panel</p>

      {/* Error general (en rojo), si lo hay */}
      <GlobalError>{globalError}</GlobalError>

      <label className="field-label" htmlFor="username">
        Usuario
      </label>
      <input
        id="username"
        name="username"
        className="field-input"
        value={form.username}        // muestra lo que guarda el estado "form"
        onChange={handleChange}      // cada tecla -> actualiza el estado
        autoComplete="username"
        required
      />
      <FieldError field="username" errors={errors} />

      <label className="field-label" htmlFor="password">
        Contraseña
      </label>
      <input
        id="password"
        name="password"
        type="password"              // type=password: los puntos ocultan lo escrito
        className="field-input"
        value={form.password}
        onChange={handleChange}
        autoComplete="current-password"
        required
      />
      <FieldError field="password" errors={errors} />

      {/* Botón de envío. disabled={loading} lo bloquea mientras se espera la API. */}
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>

      {/* Pista para probar la demo (el usuario "admin" se siembra en la API). */}
      <p className="auth-hint">
        Demo: usuario <code>admin</code>, contraseña <code>1234</code>
      </p>
    </form>
  )
}