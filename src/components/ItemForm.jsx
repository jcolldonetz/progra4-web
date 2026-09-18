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
 * Crea o edita un item según el contrato de openapi.yaml.
 * itemId = null -> POST /items; itemId = número -> PUT /items/{id}
 * (en edición, precarga los datos con GET /items/{id}).
 *
 * Se muestra como un overlay centrado vertical y horizontalmente.
 * Solo se cierra con la X o con Cancelar.
 *
 * Props opcionales:
 *  - categorias: lista [{id, nombre}...] para el select "Categoría".
 *  - initialCategoriaId: categoría preseleccionada al crear (ej. al agregar
 *    items desde la página de una categoría).
 */
export default function ItemForm({ itemId, onSaved, onCancel, categorias = [], initialCategoriaId = null }) {
  const isEdit = itemId != null

  const [form, setForm] = useState({ nombre: '', precio: '', categoria_id: String(initialCategoriaId ?? '') })
  const [errors, setErrors] = useState(null)
  const [globalError, setGlobalError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(!isEdit)
  const nombreRef = useRef(null)

  useEffect(() => {
    if (!isEdit) return

    let active = true
    api.items
      .get(itemId)
      .then((item) => {
        if (!active) return
        setForm({
          nombre: item.nombre,
          precio: String(item.precio),
          categoria_id: String(item.categoria_id ?? ''),
        })
      })
      .catch((err) => setGlobalError(err.message))
      .finally(() => {
        if (active) setFetched(true)
      })

    return () => {
      active = false
    }
  }, [itemId, isEdit])

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
      const payload = {
        nombre: form.nombre,
        precio: Number(form.precio),
        categoria_id: form.categoria_id === '' ? null : Number(form.categoria_id),
      }
      if (isEdit) await api.items.update(itemId, payload)
      else await api.items.create(payload)
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
        aria-labelledby="item-form-title"
      >
        <div className="modal-head">
          <h2 id="item-form-title" className="modal-title">
            {isEdit ? 'Editar ítem' : 'Nuevo ítem'}
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

        <label className="field-label" htmlFor="precio">
          Precio
        </label>
        <input
          id="precio"
          name="precio"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          className="field-input"
          value={form.precio}
          onChange={handleChange}
          required
        />
        <FieldError field="precio" errors={errors} />

        <label className="field-label" htmlFor="categoria_id">
          Categoría
        </label>
        <select
          id="categoria_id"
          name="categoria_id"
          className="field-input"
          value={form.categoria_id}
          onChange={handleChange}
        >
          <option value="">— Sin categoría —</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
        <FieldError field="categoria_id" errors={errors} />

        <div className="form-actions">
          <IconButton
            icon={loading ? Loader2 : Check}
            label={isEdit ? 'Guardar cambios' : 'Crear ítem'}
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