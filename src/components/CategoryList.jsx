import { Link } from 'react-router-dom'

function Spinner() {
  return <div className="spinner" role="status" aria-label="Cargando" />
}

/**
 * Muestra la tabla de categorías con su items_count.
 * Se reutiliza en el Dashboard y en la página Categorías.
 * El enlace "Ver items" navega a /categorias/{id}/items (lado "N" de la
 * relación 1:N demostrando el formulario de items en otra página).
 */
export default function CategoryList({ items, loading, onNew, onEdit, onDelete }) {
  if (loading) return <Spinner />

  if (items.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h2>Categorías</h2>
          <button type="button" className="btn btn-primary" onClick={onNew}>
            + Nueva categoría
          </button>
        </div>
        <p className="empty">No hay categorías registradas.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Categorías</h2>
        <button type="button" className="btn btn-primary" onClick={onNew}>
          + Nueva categoría
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th className="num">Ítems</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.nombre}</td>
              <td className="num">{item.items_count}</td>
              <td className="actions">
                <Link className="btn btn-small" to={`/categorias/${item.id}/items`}>
                  Ver items
                </Link>
                <button type="button" className="btn btn-small" onClick={() => onEdit(item)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-danger"
                  onClick={() => onDelete(item)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}