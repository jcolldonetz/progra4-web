import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, logout } from '../stores/authStore'
import { api, ApiError } from '../services/api'
import Navbar from '../components/Navbar'
import ItemList from '../components/ItemList'
import ItemForm from '../components/ItemForm'
import CategoryList from '../components/CategoryList'
import CategoryForm from '../components/CategoryForm'

function GlobalError({ children }) {
  if (!children) return null
  return <div className="alert alert-error">{children}</div>
}

/**
 * Panel principal: muestra en dos columnas la gestión de items y de
 * categorías. Ambos formularios (ItemForm y CategoryForm) se usan aquí para
 * demostrar que los mismos componentes se reutilizan en otras páginas:
 * @see ItemsPage y @see CategoryPage
 */
export default function DashboardPage() {
  const { isAuthenticated } = useAuth()

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [error, setError] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState(null)
  const [editingCat, setEditingCat] = useState(null)

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
      .list()
      .then((data) => active && setItems(data))
      .catch(guard(() => setError('No se pudieron cargar los ítems.')))
      .finally(() => active && setLoading(false))

    api.categorias
      .list()
      .then((data) => active && setCategories(data))
      .catch(guard(() => setError('No se pudieron cargar las categorías.')))
      .finally(() => active && setLoadingCategories(false))

    return () => {
      active = false
    }
  }, [refresh])

  const reload = () => {
    setLoading(true)
    setLoadingCategories(true)
    setError(null)
    setRefresh((r) => r + 1)
  }

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`¿Eliminar el ítem "${item.nombre}"?`)) return
    try {
      await api.items.remove(item.id)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteCategory = async (cat) => {
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

        <div className="grid-2">
          <section>
            {editing === null ? (
              <ItemList
                items={items}
                loading={loading}
                categorias={categories}
                onNew={() => setEditing('nuevo')}
                onEdit={(item) => setEditing(item.id)}
                onDelete={handleDeleteItem}
              />
            ) : (
              <ItemForm
                itemId={editing === 'nuevo' ? null : editing}
                categorias={categories}
                onSaved={() => {
                  setEditing(null)
                  reload()
                }}
                onCancel={() => setEditing(null)}
              />
            )}
          </section>

          <section>
            {editingCat === null ? (
              <CategoryList
                items={categories}
                loading={loadingCategories}
                onNew={() => setEditingCat('nuevo')}
                onEdit={(cat) => setEditingCat(cat.id)}
                onDelete={handleDeleteCategory}
              />
            ) : (
              <CategoryForm
                categoriaId={editingCat === 'nuevo' ? null : editingCat}
                onSaved={() => {
                  setEditingCat(null)
                  reload()
                }}
                onCancel={() => setEditingCat(null)}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  )
}