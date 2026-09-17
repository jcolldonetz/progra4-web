function formatPrice(value) {
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(num)
}

function Spinner() {
  return <div className="spinner" role="status" aria-label="Cargando" />
}

/**
 * Controles Anterior/Siguiente + contador + selector de cantidad por página,
 * según el meta de la API. No se muestran hasta que llega el meta (carga inicial).
 */
function Pagination({ meta, onPageChange, onPerPageChange }) {
  if (!meta) return null

  const { page, total, total_pages: totalPages } = meta
  const perPageOptions = [10, 20, 50, 100]

  return (
    <nav className="pagination" aria-label="Paginación de items">
      <span className="pagination-info">
        {total} {total === 1 ? 'resultado' : 'resultados'} · página {page} de {totalPages}
      </span>
      <label className="pagination-per-page">
        Por página
        <select value={meta.per_page} onChange={(e) => onPerPageChange(Number(e.target.value))}>
          {perPageOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="pagination-buttons">
        <button
          type="button"
          className="btn btn-small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹ Anterior
        </button>
        <button
          type="button"
          className="btn btn-small"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente ›
        </button>
      </div>
    </nav>
  )
}

/**
 * Muestra la tabla de items (puede usarse tanto en Dashboard como en las
 * páginas de Items y de Items-por-Categoría).
 *
 * Props opcionales:
 *  - categorias: lista [{id, nombre}...] para mostrar el nombre en la columna
 *    "Categoría" (si no se pasa, la columna no aparece).
 *  - titulo: texto alternativo para el encabezado h2 (default "Ítems").
 *  - meta: {page, total, total_pages} proveniente de la API paginada.
 *  - onPageChange: callback que recibe la página a la que navegar.
 *  - onPerPageChange: callback que recibe la nueva cantidad por página.
 */
export default function ItemList({ items, loading, onNew, onEdit, onDelete, onRefresh, categorias, titulo = 'Ítems', meta, onPageChange, onPerPageChange }) {
  const catMap = Array.isArray(categorias)
    ? Object.fromEntries(categorias.map((c) => [c.id, c.nombre]))
    : null

  if (loading) return <Spinner />

  if (items.length === 0) {
    return (
      <>
        <div className="page-header">
          <h2>{titulo}</h2>
          {onRefresh && (
            <button type="button" className="btn btn-small" onClick={onRefresh}>
              ⟳ Actualizar
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onNew}>
            + Nuevo ítem
          </button>
        </div>
        <p className="empty">No hay ítems registrados.</p>
      </>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>{titulo}</h2>
        {onRefresh && (
          <button type="button" className="btn btn-small" onClick={onRefresh}>
            ⟳ Actualizar
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={onNew}>
          + Nuevo ítem
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th className="num">Precio</th>
            {catMap !== null && <th>Categoría</th>}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.nombre}</td>
              <td className="num">{formatPrice(item.precio)}</td>
              {catMap !== null && (
                <td>{item.categoria_id != null ? catMap[item.categoria_id] ?? '—' : '—'}</td>
              )}
              <td className="actions">
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
      <Pagination meta={meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} />
    </div>
  )
}