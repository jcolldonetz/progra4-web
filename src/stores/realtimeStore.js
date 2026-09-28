import { useSyncExternalStore } from 'react'
import { getStatus, start, subscribeStatus, stop } from '../services/realtime'

/*
 * Store del canal realtime siguiendo el mismo patrón "externo" que authStore:
 * un estado que vive fuera de React y se suscribe con useSyncExternalStore.
 *
 * - connect()/disconnect() se enlazan con la sesión: solo se conecta cuando
 *   hay un token (lo lee realtime.js al construir la URL del WebSocket).
 * - status expone getStatus() para pintar el indicador de conexión.
 */
let status = getStatus()

const listeners = new Set()

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return status
}

function setStatus(next) {
  if (status === next) return
  status = next
  listeners.forEach((listener) => listener())
}

subscribeStatus(setStatus)

export function connect() {
  start()
}

export function disconnect() {
  stop()
}

export function useRealtime() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return {
    status: snapshot,
    connect,
    disconnect,
  }
}