import { useEffect, useState } from 'react'
import { api, ApiError } from '../services/api'

function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

function FieldError({ field, errors }) {
  if (!field || !errors || !errors[field]) return null
  return <div className="field-error">{errors[field].join(', ')}</div>
}

/**
 * Crea o edita una categoria según /categorias y /categorias/{id}.
 * categoriaId = null -> POST /categorias; número -> PUT /categorias/{id}.
 * Este formulario se reutiliza en el Dashboard y en la página Categorías.
 */
export default function CategoryForm({ categoriaId, onSaved, onCancel }) {
  const isEdit = categoriaId != null

  const [form, setForm] = useState({ nombre: '' })
  const [errors, setErrors] = useState(null)
  const [globalError, setGlobalError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(!isEdit)

  useEffect(() => {
    if (!isEdit) return

    let active = true
    api.categorias
      .get(categoriaId)
      .then((categoria) => {
        if (active) setForm({ nombre: categoria.nombre })
      })
      .catch((err) => setGlobalError(err.message))
      .finally(() => {
        if (active) setFetched(true)
      })

    return () => {
      active = false
    }
  }, [categoriaId, isEdit])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors(null)
    setGlobalError(null)
    setLoading(true)
    try {
      const payload = { nombre: form.nombre }
      if (isEdit) await api.categorias.update(categoriaId, payload)
      else await api.categorias.create(payload)
      onSaved?.()
    } catch (err) {
      if (err instanceof ApiError && err.errors) setErrors(err.errors)
      else setGlobalError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!fetched) return null

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isEdit ? 'Editar categoría' : 'Nueva categoría'}</h2>
        <button type="button" className="btn btn-small" onClick={onCancel}>
          Volver
        </button>
      </div>

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        <GlobalError>{globalError}</GlobalError>

        <label className="field-label" htmlFor="nombre">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          className="field-input"
          value={form.nombre}
          onChange={handleChange}
          required
        />
        <FieldError field="nombre" errors={errors} />

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear categoría'}
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}