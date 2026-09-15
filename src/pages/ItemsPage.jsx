import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, logout } from '../stores/authStore'
import { api, ApiError } from '../services/api'
import Navbar from '../components/Navbar'
import ItemList from '../components/ItemList'
import ItemForm from '../components/ItemForm'

function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

/**
 * Página dedicada a la gestión de items.
 * Reutiliza ItemForm — el mismo componente usado en DashboardPage — para
 * demostrar que un formulario puede servir en más de una pantalla.
 */
export default function ItemsPage() {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [categorias, setCategories] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    const guard = (fn) => (err) => {
      if (!active) return
      if (err instanceof ApiError && err.status === 401) {
        logout()
        return
      }
      fn()
    }

    api.items
      .list({ page })
      .then((res) => {
        if (!active) return
        setItems(res.data)
        setMeta(res.meta)
      })
      .catch(guard(() => setError('No se pudieron cargar los ítems.')))
      .finally(() => active && setLoading(false))

    api.categorias
      .list()
      .then((data) => active && setCategories(data))
      .catch(guard(() => {}))

    return () => {
      active = false
    }
  }, [refresh, page])

  const reload = () => {
    setPage(1)
    setLoading(true)
    setError(null)
    setRefresh((r) => r + 1)
  }

  const goToPage = (next) => {
    setPage(next)
    setLoading(true)
    setError(null)
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar el ítem "${item.nombre}"?`)) return
    try {
      await api.items.remove(item.id)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="app-layout">
      <Navbar />
      <main className="content">
        <GlobalError>{error}</GlobalError>

        {editing === null ? (
          <ItemList
            items={items}
            loading={loading}
            categorias={categorias}
            meta={meta}
            onPageChange={goToPage}
            onNew={() => setEditing('nuevo')}
            onEdit={(item) => setEditing(item.id)}
            onDelete={handleDelete}
          />
        ) : (
          <ItemForm
            itemId={editing === 'nuevo' ? null : editing}
            categorias={categorias}
            onSaved={() => {
              setEditing(null)
              reload()
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </main>
    </div>
  )
}