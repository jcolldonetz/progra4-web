import { useSyncExternalStore } from 'react'
import { api, storage } from '../services/api'

let state = {
  user: storage.getUser(),
  token: storage.getToken(),
}

const listeners = new Set()

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

function setState(next) {
  state = next
  listeners.forEach((listener) => listener())
}

export async function login(payload) {
  const data = await api.login(payload)
  storage.setToken(data.token)
  storage.setUser(data.user)
  setState({ user: data.user, token: data.token })
  return data.user
}

export async function register(payload) {
  const data = await api.register(payload)
  storage.setToken(data.token)
  storage.setUser(data.user)
  setState({ user: data.user, token: data.token })
  return data.user
}

export function logout() {
  storage.setToken(null)
  storage.setUser(null)
  setState({ user: null, token: null })
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)
  return {
    ...snapshot,
    isAuthenticated: Boolean(snapshot.token),
    login,
    register,
    logout,
  }
}