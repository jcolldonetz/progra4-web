import { useState } from 'react'
import { useAuth } from '../stores/authStore'
import { ApiError } from '../services/api'

function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

function FieldError({ field, errors }) {
  if (!field || !errors || !errors[field]) return null
  return <div className="field-error">{errors[field].join(', ')}</div>
}

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState(null)
  const [globalError, setGlobalError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors(null)
    setGlobalError(null)
    setLoading(true)
    try {
      await login(form)
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors)
      else setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <h1 className="auth-title">Iniciar sesión</h1>
      <p className="auth-subtitle">Bienvenido a tu panel</p>

      <GlobalError>{globalError}</GlobalError>

      <label className="field-label" htmlFor="username">
        Usuario
      </label>
      <input
        id="username"
        name="username"
        className="field-input"
        value={form.username}
        onChange={handleChange}
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
        type="password"
        className="field-input"
        value={form.password}
        onChange={handleChange}
        autoComplete="current-password"
        required
      />
      <FieldError field="password" errors={errors} />

      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>

      <p className="auth-hint">
        Demo: usuario <code>admin</code>, contraseña <code>1234</code>
      </p>
    </form>
  )
}