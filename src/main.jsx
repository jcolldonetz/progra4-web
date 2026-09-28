// =============================================================================
// main.jsx — PUNTO DE ENTRADA DE LA APLICACIÓN (el archivo que el navegador
// ejecuta primero).
//
// Para un programador que no conoce React:
//  - .jsx NO es JavaScript puro: es JSX, que permite escribir HTML dentro de
//    JavaScript. El navegador no entiende JSX, por eso Vite lo convierte a
//    JavaScript normal antes de enviárselo.
//  - Un "componente" de React es una función que devuelve la pantalla (HTML)
//    que se debe mostrar en un momento dado.
//  - "import" trae código de otros archivos; "export default" entrega la
//    función principal de este archivo para que otros archivos la usen.
// =============================================================================

import { createRoot } from 'react-dom/client'      // createRoot: "monta" la app sobre el HTML
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom' // enrutador de URLs
import './index.css'                               // estilos globales de toda la app
import LoginPage from './pages/LoginPage'          // pantalla de login
import RegisterPage from './pages/RegisterPage'    // pantalla de registro
import DashboardPage from './pages/DashboardPage'  // pantalla del panel (solo con sesión)
import ItemsPage from './pages/ItemsPage'          // gestión dedicada de items
import CategoryPage from './pages/CategoryPage'    // gestión dedicada de categorías
import CategoryItemsPage from './pages/CategoryItemsPage' // items de una categoría
import RealtimeToasts from './components/RealtimeToasts'  // toasts de pedidos en vivo

// App es el componente raíz: aquí se declara el ÁRBOL DE RUTAS, es decir, la
// tabla que relaciona cada URL del navegador con la pantalla que se muestra.
export default function App() {
  return (
    // BrowserRouter: activa el enrutado. A partir de aquí React observa la URL.
    <BrowserRouter>
      {/* Toasts realtime: montado una sola vez, por encima de todas las rutas. */}
      <RealtimeToasts />
      <Routes>
        {/* URL /login  -> pantalla de LoginPage (formulario de inicio de sesión) */}
        <Route path="/login" element={<LoginPage />} />
        {/* URL /register -> pantalla de RegisterPage (formulario de registro) */}
        <Route path="/register" element={<RegisterPage />} />
        {/* URL /      -> pantalla de DashboardPage (protegida: solo con sesión) */}
        <Route path="/" element={<DashboardPage />} />
        {/* URL /items -> gestión dedicada de items (reutiliza ItemForm) */}
        <Route path="/items" element={<ItemsPage />} />
        {/* URL /categorias -> gestión dedicada de categorías (reutiliza CategoryForm) */}
        <Route path="/categorias" element={<CategoryPage />} />
        {/* URL /categorias/:id/items -> items de una categoría (reutiliza ItemForm) */}
        <Route path="/categorias/:id/items" element={<CategoryItemsPage />} />
        {/* Cualquier otra URL (*) no existe: se redirige a "/" sin dejar
            rastro en el historial ("replace"). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

// "Monta" la aplicación: busca en public/index.html el elemento
// <div id="root"></div> (un "hueco" vacío) y coloca dentro TODO el árbol de
// rutas de arriba. A partir de ese momento React controla el contenido.
//
// NOTA (lección de la casa): NO usamos <StrictMode>. StrictMode es una
// validación extra de React que, en desarrollo, monta → desmonta → vuelve a
// montar cada componente para detectar efectos mal hechos. Nuestro canal
// realtime es un singleton a nivel de módulo que se conecta desde los efectos
// de RealtimeToasts, y ese doble ciclo abría WebSockets duplicados (se veía
// como "Conectados: 1, 2, 2, 3..." en el server). Sin StrictMode cada
// componente se monta UNA vez y hay un solo socket por navegador.
createRoot(document.getElementById('root')).render(<App />)