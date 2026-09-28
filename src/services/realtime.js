import { storage } from './api'

/** URL base del server WebSocket. En desarrollo se usa el proxy de Vite ("/ws"
 * con ws:true), que reenvía a http://localhost:8081. Se puede sobreescribir con
 * VITE_WS_URL (p. ej. ws://192.168.100.73:8081/ws para un celular directo). */
const WS_URL = import.meta.env.VITE_WS_URL || (() => {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws`
})()

/** Estados posibles del canal realtime. */
export const STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
}

/** Retardo inicial de reconexión (1 s) y tope máximo (30 s). */
const BACKOFF_INITIAL_MS = 1_000
const BACKOFF_MAX_MS = 30_000

let ws = null
let running = false // start()/stop(): lo controla la capa de sesión
let reconnectAttempts = 0
let reconnectTimer = null
let status = STATUS.DISCONNECTED

const messageListeners = new Set()
const statusListeners = new Set()

function emitStatus() {
  statusListeners.forEach((l) => l(status))
}

function setStatus(next) {
  if (status === next) return
  status = next
  emitStatus()
}

function wsUrl() {
  const url = new URL(WS_URL)
  url.searchParams.set('token', storage.getToken() || '')
  return url.toString()
}

function scheduleReconnect() {
  if (!running) return
  const delay = Math.min(BACKOFF_INITIAL_MS * 2 ** reconnectAttempts, BACKOFF_MAX_MS)
  reconnectAttempts += 1
  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(open, delay)
}

function open() {
  // Jamás dos sockets a la vez: si ya hay uno vivo (o en cierre), se deja que
  // termine su ciclo antes de abrir el siguiente.
  if (!running || ws) return
  try {
    const socket = new WebSocket(wsUrl())
    ws = socket
    setStatus(STATUS.CONNECTING)

    socket.addEventListener('open', () => {
      reconnectAttempts = 0
      setStatus(STATUS.CONNECTED)
    })

    socket.addEventListener('message', (event) => {
      let payload = null
      try {
        payload = JSON.parse(String(event.data))
      } catch {
        return // mensaje no JSON: se ignora
      }
      messageListeners.forEach((l) => l(payload))
    })

    socket.addEventListener('close', () => {
      if (ws === socket) ws = null
      setStatus(STATUS.DISCONNECTED)
      scheduleReconnect()
    })

    socket.addEventListener('error', () => {
      // El "close" que sigue dispara la reconexión.
      try {
        socket.close()
      } catch {
        // ignore
      }
    })
  } catch {
    scheduleReconnect()
  }
}

/** Abre (o abre de nuevo) el canal realtime. Idempotente. */
export function start() {
  if (running && ws) return
  running = true
  if (!ws) open()
}

/** Cierra el canal realtime y cancela reintentos. */
export function stop() {
  running = false
  reconnectAttempts = 0
  clearTimeout(reconnectTimer)
  if (ws) {
    try {
      ws.close()
    } catch {
      // ignore
    }
    ws = null
  }
  setStatus(STATUS.DISCONNECTED)
}

/** Suscribe un listener a cada mensaje JSON recibido; devuelve unsubscribe. */
export function subscribe(fn) {
  messageListeners.add(fn)
  return () => messageListeners.delete(fn)
}

/** Suscribe un listener a los cambios de estado; devuelve unsubscribe. */
export function subscribeStatus(fn) {
  statusListeners.add(fn)
  fn(status)
  return () => statusListeners.delete(fn)
}

export function getStatus() {
  return status
}