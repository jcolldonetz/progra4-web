import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Destino por defecto del proxy '/api' cuando VITE_API_URL no esta definido.
const API_POR_DEFECTO = 'http://localhost:8000'

// ---------------------------------------------------------------------------
// PROBAR DESDE UN CELULAR EN LA MISMA RED WiFi
//
//   host: true        -> el dev server escucha en todas las interfaces, asi que
//                        se alcanza en http://<IP-DE-LA-PC>:5173. 'localhost' o
//                        '127.0.0.1' solo escuchan en la PC.
//   strictPort: true  -> si el 5173 esta ocupado, Vite no salta al 5174: falla
//                        avisando, para que la URL del celular sea la documentada.
//
//   El proxy '/api' corre en la PC: el celular le pide /api al dev server y este
//   lo reenvia a la API en loopback. Por eso la API puede quedarse en
//   'php -S localhost:8000' (sin exponerla) y NO hace falta definir
//   VITE_API_URL para probar desde el celular. Ver README.md.
// ---------------------------------------------------------------------------
export default defineConfig(({ mode }) => {
  // loadEnv() lee los archivos .env / .env.<mode>. process.env solo ve lo que se
  // exporto en la terminal, por lo que usar solo process.env dejaba al cliente
  // (src/services/api.js, que usa import.meta.env) y al proxy con destinos
  // distintos cuando la URL venia de un archivo .env.
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = process.env.VITE_API_URL || env.VITE_API_URL || API_POR_DEFECTO

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
