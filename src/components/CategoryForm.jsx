import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { api, ApiError } from '../services/api'
import IconButton from './IconButton'

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
 * Se muestra como un overlay centrado vertical y horizontalmente y solo se
 * cierra con la X o con Cancelar. Se reutiliza en el Dashboard y en Categorías.
 */
export default function CategoryForm({ categoriaId, onSaved, onCancel }) {
  const isEdit = categoriaId != null

  const [form, setForm] = useState({ nombre: '' })
  const [errors, setErrors] = useState(null)
  const [globalError, setGlobalError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(!isEdit)
  const nombreRef = useRef(null)

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

  useEffect(() => {
    if (fetched) nombreRef.current?.focus()
  }, [fetched])

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
    <div className="modal-overlay">
      <form
        className="modal-card"
        onSubmit={handleSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-form-title"
      >
        <div className="modal-head">
          <h2 id="category-form-title" className="modal-title">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <IconButton icon={X} label="Cerrar" onClick={onCancel} />
        </div>

        <GlobalError>{globalError}</GlobalError>

        <label className="field-label" htmlFor="nombre">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          ref={nombreRef}
          className="field-input"
          value={form.nombre}
          onChange={handleChange}
          required
        />
        <FieldError field="nombre" errors={errors} />

        <div className="form-actions">
          <IconButton
            icon={loading ? Loader2 : Check}
            label={isEdit ? 'Guardar cambios' : 'Crear categoría'}
            variant="primary"
            type="submit"
            disabled={loading}
            className={loading ? 'icon-spin' : ''}
          />
          <IconButton icon={X} label="Cancelar" onClick={onCancel} />
        </div>
      </form>
    </div>
  )
}