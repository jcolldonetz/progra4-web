import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../api/client'
import { GlobalError, FieldError } from '../components/common'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', password2: '' })
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

    if (form.password !== form.password2) {
      setErrors({ password2: ['Las contraseñas no coinciden.'] })
      return
    }

    setLoading(true)
    try {
      await register({ username: form.username, password: form.password })
      navigate('/items')
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors)
      else setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Regístrate para gestionar ítems</p>

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
          autoComplete="new-password"
          required
        />
        <FieldError field="password" errors={errors} />

        <label className="field-label" htmlFor="password2">
          Repetir contraseña
        </label>
        <input
          id="password2"
          name="password2"
          type="password"
          className="field-input"
          value={form.password2}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />
        <FieldError field="password2" errors={errors} />

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Creando…' : 'Crear cuenta'}
        </button>

        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  )
}
