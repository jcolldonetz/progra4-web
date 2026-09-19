import { ChevronLeft, ChevronRight, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import IconButton from './IconButton'

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
        <IconButton
          icon={ChevronLeft}
          label="Página anterior"
          size="small"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        <IconButton
          icon={ChevronRight}
          label="Página siguiente"
          size="small"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </nav>
  )
}

/// Barra de filtros: selector de categoría y búsqueda por nombre.
/// Se renderiza solo cuando la página provee los handlers (props opcionales).
function Filters({ categorias, categoriaId, onCategoriaChange, query, onQueryChange }) {
  if (!onCategoriaChange || !onQueryChange) {
    return null
  }

  return (
    <div className="filters">
      <label className="filters-field">
        <span className="filters-label">Categoría</span>
        <select
          className="field-input"
          value={categoriaId || ''}
          onChange={(e) => onCategoriaChange(e.target.value)}
        >
          <option value="">Todas</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="filters-field filters-field-grow">
        <span className="filters-label">Buscar por nombre</span>
        <span className="search-box">
          <Search size={16} aria-hidden="true" />
          <input
            className="field-input search-input"
            type="search"
            placeholder="Ej. monitor"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </span>
      </label>
    </div>
  )
}

/**
 * Muestra la tabla de items (escritorio) o tarjetas (móvil).
 *
 * Props opcionales:
 *  - categorias: lista [{id, nombre}...] para mostrar el nombre en la columna
 *    "Categoría" (si no se pasa, la columna no aparece).
 *  - titulo: texto alternativo para el encabezado h2 (default "Ítems").
 *  - meta: {page, total, total_pages} proveniente de la API paginada.
 *  - onPageChange: callback que recibe la página a la que navegar.
 *  - onPerPageChange: callback que recibe la nueva cantidad por página.
 *  - categoriaId / onCategoriaChange / query / onQueryChange: filtros de la
 *    barra superior. Si onCategoriaChange y onQueryChange no se pasan, la
 *    barra no se muestra.
 */
export default function ItemList({ items, loading, onNew, onEdit, onDelete, onRefresh, categorias, titulo = 'Ítems', meta, onPageChange, onPerPageChange, categoriaId, onCategoriaChange, query, onQueryChange }) {
  const catMap = Array.isArray(categorias)
    ? Object.fromEntries(categorias.map((c) => [c.id, c.nombre]))
    : null

  // Cabecera y filtros SIEMPRE montados: el input de búsqueda no se desmonta
  // mientras carga, así conserva el foco y el cursor entre búsquedas.
  const header = (
    <div className="page-header">
      <h2>{titulo}</h2>
      <div className="page-actions">
        {onRefresh && (
          <IconButton icon={RefreshCw} label="Actualizar" onClick={onRefresh} />
        )}
        <IconButton icon={Plus} label="Nuevo ítem" variant="primary" onClick={onNew} />
      </div>
    </div>
  )

  const filters = (
    <Filters
      categorias={categorias}
      categoriaId={categoriaId}
      onCategoriaChange={onCategoriaChange}
      query={query}
      onQueryChange={onQueryChange}
    />
  )

  const hasFilters = Boolean(categoriaId) || Boolean(query)

  const actions = (item) => (
    <>
      <IconButton icon={Pencil} label="Editar" onClick={() => onEdit(item)} />
      <IconButton
        icon={Trash2}
        label="Eliminar"
        variant="danger"
        onClick={() => onDelete(item)}
      />
    </>
  )

  let content
  if (loading) {
    content = <Spinner />
  } else if (items.length === 0) {
    content = (
      <p className="empty">{hasFilters ? 'No hay ítems que coincidan con los filtros.' : 'No hay ítems registrados.'}</p>
    )
  } else {
    content = (
      <>
        <div className="only-desktop">
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
                  <td className="actions">{actions(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cards">
          {items.map((item) => (
            <article className="card" key={item.id}>
              <div className="card-head">
                <h3 className="card-title">{item.nombre}</h3>
                <span className="card-badge">#{item.id}</span>
              </div>
              <div className="card-meta">
                <span className="card-price">{formatPrice(item.precio)}</span>
                {catMap !== null && (
                  <span>
                    {item.categoria_id != null ? catMap[item.categoria_id] ?? 'Sin categoría' : 'Sin categoría'}
                  </span>
                )}
              </div>
              <div className="card-actions">{actions(item)}</div>
            </article>
          ))}
        </div>

        <Pagination meta={meta} onPageChange={onPageChange} onPerPageChange={onPerPageChange} />
      </>
    )
  }

  return (
    <div className="page">
      {header}
      {filters}
      {content}
    </div>
  )
}