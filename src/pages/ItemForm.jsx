import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { GlobalError, FieldError } from '../components/common'

export default function ItemForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ nombre: '', precio: '' })
  const [errors, setErrors] = useState(null)
  const [globalError, setGlobalError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!isEdit) {
      setFetched(true)
      return
    }
    let active = true
    api.items
      .get(id)
      .then((item) => {
        if (!active) return
        setForm({ nombre: item.nombre, precio: String(item.precio) })
      })
      .catch((err) => setGlobalError(err.message))
      .finally(() => active && setFetched(true))
    return () => {
      active = false
    }
  }, [id, isEdit])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors(null)
    setGlobalError(null)
    setLoading(true)
    try {
      const payload = { nombre: form.nombre, precio: Number(form.precio) }
      if (isEdit) await api.items.update(id, payload)
      else await api.items.create(payload)
      navigate('/items')
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
        <h2>{isEdit ? 'Editar ítem' : 'Nuevo ítem'}</h2>
        <Link to="/items" className="btn btn-small">
          Volver
        </Link>
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

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear ítem'}
          </button>
          <Link to="/items" className="btn">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
