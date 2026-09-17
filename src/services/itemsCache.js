import { api } from './api'

/** Vigencia de la caché en milisegundos (30 s). */
export const CACHE_TTL_MS = 30_000

/** Clave raíz del listado de categorías (sin paginar). */
const KEY_CATEGORIAS = 'categorias'

function itemsKey(page, perPage) {
  return `items:${page}:${perPage}`
}

function categoriaItemsKey(id, page, perPage) {
  return `categoria:${id}:items:${page}:${perPage}`
}

function isItemKey(key) {
  return key.startsWith('items:') || key.startsWith('categoria:')
}

const entries = new Map()
const inflight = new Map()

/** Devuelve la entrada si existe y no venció; si venció, la elimina y devuelve null. */
function getValid(key) {
  const entry = entries.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    entries.delete(key)
    return null
  }
  return entry
}

/**
 * Lee desde caché o ejecuta fetcher. Deduplica peticiones en vuelo por clave.
 * Resultado: { data, meta, fromCache, cachedAt }.
 */
async function load(key, fetcher, { force = false } = {}) {
  if (!force) {
    const entry = getValid(key)
    if (entry) {
      return { data: entry.data, meta: entry.meta, fromCache: true, cachedAt: entry.cachedAt }
    }
  }

  const existing = inflight.get(key)
  if (existing) return existing

  const promise = fetcher().then((res) => {
    const entry = { data: res.data, meta: res.meta }
    entries.set(key, { ...entry, cachedAt: Date.now(), expiresAt: Date.now() + CACHE_TTL_MS })
    return { ...entry, fromCache: false, cachedAt: Date.now() }
  })
  inflight.set(key, promise)
  try {
    return await promise
  } finally {
    inflight.delete(key)
  }
}

/** Limpia las claves de listados de items (general y por categoría). */
export function invalidateItems() {
  for (const key of entries.keys()) {
    if (isItemKey(key)) entries.delete(key)
  }
}

/** Limpia el listado de categorías (afecta items_count). */
export function invalidateCategories() {
  entries.delete(KEY_CATEGORIAS)
}

/** Invalida toda la caché (útil al cerrar sesión). */
export function invalidateAll() {
  entries.clear()
}

export const itemsCache = {
  list(params = {}, options) {
    const page = params.page ?? 1
    const perPage = params.per_page ?? 10
    return load(itemsKey(page, perPage), () => api.items.list(params), options)
  },
  listByCategoria(id, params = {}, options) {
    const page = params.page ?? 1
    const perPage = params.per_page ?? 10
    return load(categoriaItemsKey(id, page, perPage), () => api.categorias.items(id, params), options)
  },
  listCategorias(options) {
    return load(KEY_CATEGORIAS, () => api.categorias.list().then((data) => ({ data, meta: null })), options)
  },
}