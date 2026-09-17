import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, logout } from '../stores/authStore'
import { api, ApiError } from '../services/api'
import { itemsCache, invalidateAll } from '../services/itemsCache'
import Navbar from '../components/Navbar'
import CategoryList from '../components/CategoryList'
import CategoryForm from '../components/CategoryForm'

function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

/**
 * Página dedicada a la gestión de categorías.
 * Reutiliza CategoryForm — el mismo componente usado en DashboardPage — para
 * demostrar que un formulario puede servir en más de una pantalla.
 */
export default function CategoryPage() {
  const { isAuthenticated } = useAuth()
  const [categorias, setCategories] = useState([])
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

    itemsCache
      .listCategorias()
      .then((res) => active && setCategories(res.data))
      .catch(guard(() => setError('No se pudieron cargar las categorías.')))
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [refresh])

  const reload = () => {
    invalidateAll()
    setLoading(true)
    setError(null)
    setRefresh((r) => r + 1)
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
    try {
      await api.categorias.remove(cat.id)
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
          <CategoryList
            items={categorias}
            loading={loading}
            onNew={() => setEditing('nuevo')}
            onEdit={(cat) => setEditing(cat.id)}
            onDelete={handleDelete}
          />
        ) : (
          <CategoryForm
            categoriaId={editing === 'nuevo' ? null : editing}
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