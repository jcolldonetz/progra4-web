import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { api, ApiError } from '../api/client'
import { formatPrice } from '../utils/format'
import { GlobalError, Spinner } from '../components/common'

export default function ItemList() {
  const { logout } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refresh, setRefresh] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await api.items.list())
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    load()
  }, [load, refresh])

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar el ítem "${nombre}"?`)) return
    try {
      await api.items.remove(id)
      setRefresh((r) => r + 1)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Ítems</h2>
        <Link to="/items/nuevo" className="btn btn-primary">
          + Nuevo ítem
        </Link>
      </div>

      <GlobalError>{error}</GlobalError>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="empty">No hay ítems registrados.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th className="num">Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nombre}</td>
                <td className="num">{formatPrice(item.precio)}</td>
                <td className="actions">
                  <Link to={`/items/${item.id}`} className="btn btn-small">
                    Ver
                  </Link>
                  <Link to={`/items/${item.id}/editar`} className="btn btn-small btn-secondary">
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(item.id, item.nombre)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
