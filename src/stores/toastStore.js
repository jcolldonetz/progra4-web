import { useSyncExternalStore } from 'react'

/*
 * Cola de toasts global (mismo patrón store-externo que authStore/realtimeStore).
 *
 * - Cualquier componente puede mostrar un toast con showToast() sin importar
 *   cómo esté compuesto el árbol (RealtimeToasts los renderiza todos arriba).
 * - kind: 'info' (fondo oscuro) | 'success' (fondo verde) | 'warning' (ámbar).
 * - Cada toast se auto-elimina a los 5 s.
 */
const TTL_MS = 5_000

let toasts = []

const listeners = new Set()

function emit() {
  listeners.forEach((l) => l())
}

function getSnapshot() {
  return toasts
}

/** Agrega un toast a la cola y programa su auto-eliminación. */
export function showToast(message, kind = 'info') {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  toasts = [...toasts, { id, message, kind }]
  emit()
  setTimeout(() => dismissToast(id), TTL_MS)
}

/** Quita un toast (lo usa el timer y cierra el ciclo si hiciera falta). */
export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

/** Hook para leer la cola de toasts en RealtimeToasts. */
export function useToasts() {
  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot,
  )
  return snapshot
}