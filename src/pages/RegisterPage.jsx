// =============================================================================
// RegisterPage.jsx — PANTALLA DE REGISTRO.
//
// En React, una "página" es un componente: una función que devuelve HTML.
// Esta página es muy simple: solo decide entre DOS cosas:
//   1) Si ya hay una sesión iniciada -> redirigir al Dashboard.
//   2) Si no hay sesión              -> mostrar el formulario de registro.
//
// La "condición de negocio" (¿está logueado?) NO vive aquí: se la pide al
// store central de autenticación (stores/authStore.js), el "memoria global"
// de la app. Así todas las pantallas ven el mismo estado de sesión.
// =============================================================================

// Enrutador: <Navigate> cambia la URL de forma declarativa y useNavigate()
// devuelve una FUNCIÓN para navegar desde código.
import { Navigate, useNavigate } from 'react-router-dom'
// Hook useAuth: lee del store el estado de la sesión actual.
import { useAuth } from '../stores/authStore'
// El formulario de registro está en un componente aparte, reutilizable.
import RegisterForm from '../components/RegisterForm'

export default function RegisterPage() {
  // "useAuth()" devuelve (entre otras cosas) el booleano isAuthenticated:
  // true si hay un token de sesión guardado (p. ej. de un login anterior
  // que no se cerró). Es reactivo: si cambia, esta pantalla se re-dibuja sola.
  const { isAuthenticated } = useAuth()

  // useNavigate devuelve la función "navigate", equivalente a teclear una URL:
  // navigate('/') manda al usuario al Dashboard.
  const navigate = useNavigate()

  // Si ya hay sesión, no tiene sentido ver el registro: se redirige a "/".
  // "replace" reemplaza la entrada del historial para que el botón "atrás"
  // del navegador no devuelva a esta pantalla.
  if (isAuthenticated) return <Navigate to="/" replace />

  // Si NO hay sesión, se pinta el formulario de registro.
  return (
    <div className="auth-page">
      {/* Se le pasa a RegisterForm una PROP (dato de entrada) llamada onSuccess:
          una función que se ejecuta CUANDO el registro tenga éxito. El formulario
          no sabe qué es un "Dashboard" ni cómo navegar: solo avisa "listo" y
          esta página decide a dónde ir. */}
      <RegisterForm onSuccess={() => navigate('/')} />
    </div>
  )
}