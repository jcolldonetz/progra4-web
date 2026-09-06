import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { formatPrice } from '../utils/format'
import { GlobalError, Spinner } from '../components/common'

export default function ItemDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItem(await api.items.get(id))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Spinner />

  return (
    <div className="page">
      <div className="page-header">
        <h2>Detalle del ítem</h2>
        <div className="page-actions">
          <Link to="/items" className="btn btn-small">
            Volver
          </Link>
          <Link to={`/items/${id}/editar`} className="btn btn-small btn-secondary">
            Editar
          </Link>
        </div>
      </div>

      <GlobalError>{error}</GlobalError>

      {item && (
        <div className="detail-card">
          <div className="detail-row">
            <span className="detail-label">ID</span>
            <span>{item.id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Nombre</span>
            <span>{item.nombre}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Precio</span>
            <span>{formatPrice(item.precio)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
