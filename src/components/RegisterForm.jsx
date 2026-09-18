// =============================================================================
// RegisterForm.jsx — FORMULARIO DE REGISTRO (usuario + contraseña).
//
// Componente reutilizable que hace tres cosas:
//   1) Dibuja el formulario (inputs y botón) en HTML/JSX.
//   2) "Recuerda" lo que el usuario va escribiendo (para eso sirven los
//      "estados" de useState).
//   3) Al enviar, llama a la API (POST /register) con los datos y muestra
//      los errores que la API devuelva (por campo o generales).
//
// No sabe qué ocurre DESPUÉS de un registro exitoso: se lo informa a la página
// padre mediante la propiedad onSuccess, y la página decide a dónde navegar.
//
// Flujo completo del registro (para leer de arriba a abajo):
//   usuario escribe  -> handleChange guarda el texto en "form"
//   usuario envía    -> handleSubmit llama a "register(form)" (capa services/api.js)
//   la API responde  -> o bien la sesión se guarda y se avisa con onSuccess(),
//                       o bien se muestra un error (global o por campo).
// =============================================================================

import { useState } from 'react'            // hook para crear "estado" en el componente
import { Link } from 'react-router-dom'      // enlace SPA (sin recarga de página)
import { Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '../stores/authStore' // store central de la sesión
import { ApiError } from '../services/api'    // clase de error que lanza la capa de API
import IconButton from './IconButton'

// Componente auxiliar: muestra un error GENERAL (ej. "El usuario ya está registrado").
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
// ejecuta cuando el registro es exitoso).
export default function RegisterForm({ onSuccess }) {
  // "register" es la función del store que llama a la API (services/api.js),
  // guarda el token y el usuario en la sesión y avisa a toda la app.
  const { register } = useAuth()

  // useState crea una "CAJA DE MEMORIA" del componente:
  //   const [valor, setValor] = useState(initial)  ->  valor = estado actual
  //                                                   setValor = función para cambiarlo
  // Cada vez que se llama a setValor, React vuelve a dibujar el componente
  // con el nuevo valor. Esos son los 4 estados de este formulario:
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' }) // lo escrito en los inputs
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

  // Maneja el evento "se envió el formulario" (botón Registrarse o tecla Enter).
  // Es una función "async": puede llamar a la API y ESPERAR su respuesta con
  // "await" sin bloquear el navegador.
  const handleSubmit = async (e) => {
    e.preventDefault() // evita la recarga nativa de la página que hace un <form> HTML
    setErrors(null) // se limpian errores anteriores en cada nuevo intento
    setGlobalError(null)
    setLoading(true) // marca "enviando...": desactiva el botón (evita doble envío)

    // Validación local (del lado del navegador) antes de tocar la API:
    // las dos contraseñas deben coincidir para crear la cuenta.
    if (form.password !== form.confirmPassword) {
      setGlobalError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    try {
      // 1) Petición POST /register. Se envía solo lo que la API entiende
      //    (confirmPassword es solo una verificación del navegador).
      await register({ username: form.username, password: form.password })
      //    Si falla, el "await" lanza una excepción -> al catch.
      onSuccess?.()     // 2) Éxito: se avisa a la página padre ("?." = solo si se pasó onSuccess).
    } catch (err) {
      // 3) La API respondió con error. Hay dos tipos:
      //    - ApiError con .errors  -> errores POR CAMPO (respuesta HTTP 422 de validación).
      //    - cualquier otro        -> error GLOBAL (p. ej. "El usuario ya está registrado").
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
      <h1 className="auth-title">Crear cuenta</h1>
      <p className="auth-subtitle">Regístrate para acceder a tu panel</p>

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
        autoComplete="new-password"
        required
      />
      <FieldError field="password" errors={errors} />

      <label className="field-label" htmlFor="confirmPassword">
        Confirmar contraseña
      </label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        className="field-input"
        value={form.confirmPassword}
        onChange={handleChange}
        autoComplete="new-password"
        required
      />

      {/* Botón de envío. disabled={loading} lo bloquea mientras se espera la API. */}
      <IconButton
        icon={loading ? Loader2 : UserPlus}
        label={loading ? 'Registrando…' : 'Registrarse'}
        variant="primary"
        type="submit"
        disabled={loading}
        className={`btn-block ${loading ? 'icon-spin' : ''}`}
      />

      {/* Acceso directo de vuelta al login: el texto cambiará de pantalla. */}
      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
      </p>
    </form>
  )
}