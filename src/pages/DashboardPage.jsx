import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth, logout } from '../stores/authStore'
import { api, ApiError } from '../services/api'
import { itemsCache, invalidateAll } from '../services/itemsCache'
import Navbar from '../components/Navbar'
import ItemList from '../components/ItemList'
import ItemForm from '../components/ItemForm'
import CategoryList from '../components/CategoryList'
import CategoryForm from '../components/CategoryForm'
import useConfirm from '../hooks/useConfirm'

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
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [loading, setLoadingItems] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [error, setError] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [editing, setEditing] = useState(null)
  const [editingCat, setEditingCat] = useState(null)
  const [ask, confirmDialog] = useConfirm()

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
      .finally(() => active && setLoadingCategories(false))

    itemsCache
      .list({ page, per_page: perPage })
      .then((res) => {
        if (!active) return
        setItems(res.data)
        setMeta(res.meta)
      })
      .catch(guard(() => setError('No se pudieron cargar los ítems.')))
      .finally(() => active && setLoadingItems(false))

    return () => {
      active = false
    }
  }, [refresh, page, perPage])

  const reload = () => {
    invalidateAll()
    setLoadingCategories(true)
    setPage(1)
    setLoadingItems(true)
    setError(null)
    setRefresh((r) => r + 1)
  }

  const goToPage = (next) => {
    setPage(next)
    setLoadingItems(true)
    setError(null)
  }

  const changePerPage = (n) => {
    setPerPage(n)
    setPage(1)
    setLoadingItems(true)
    setError(null)
  }

  const handleDeleteItem = async (item) => {
    const ok = await ask({
      title: 'Eliminar ítem',
      message: `¿Eliminar el ítem "${item.nombre}"?`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    try {
      await api.items.remove(item.id)
      reload()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteCategory = async (cat) => {
    const ok = await ask({
      title: 'Eliminar categoría',
      message: `¿Eliminar la categoría "${cat.nombre}"?`,
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
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

        {confirmDialog}

        <div className="grid-2">
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

          <section>
            {editing === null ? (
              <ItemList
                items={items}
                loading={loading}
                categorias={categories}
                meta={meta}
                onPageChange={goToPage}
                onPerPageChange={changePerPage}
                onRefresh={reload}
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
        </div>
      </main>
    </div>
  )
}