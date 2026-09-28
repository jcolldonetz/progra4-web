import { useEffect } from 'react'
import { subscribe } from '../services/realtime'

/**
 * Mantiene en vivo el stock de los ítems de una lista.
 *
 * Escucha el canal realtime y, cuando llega un evento `pedido.creado`, actualiza
 * en el estado local (setItems) el stock del item que aparece en el evento, SIN
 * refetch. Así la "otra pestaña" que hizo el pedido se refleja sola.
 *
 * @param setItems React setter del estado que ya tiene los items [{...}].
 */
export function useRealtimeItems(setItems) {
  useEffect(() => {
    return subscribe((payload) => {
      if (!payload || payload.type !== 'pedido.creado') return
      const { item } = payload
      if (!item || item.id == null) return

      setItems((prev) => {
        if (!Array.isArray(prev)) return prev
        const exists = prev.some((it) => it.id === item.id)
        if (!exists) return prev
        return prev.map((it) =>
          it.id === item.id ? { ...it, stock: item.stock } : it,
        )
      })
    })
  }, [setItems])
}