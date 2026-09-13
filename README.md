# progra4-web

Cliente web (SPA) en **React + Vite** para la API [`progra4-api`](../progra4-api).

Permite crear una cuenta (`/register`), iniciar sesión con JWT (`/login`) y, una vez autenticado, administrar la entidad **item** con operaciones CRUD (listar, ver, crear, editar y eliminar). Incluye además una **demo didáctica de persistencia en el cliente** (`/storage`) sobre `localStorage`, `sessionStorage` y cookies, pensada para la clase de Programación 4.

## Características

- Registro de usuarios y login (`POST /register` y `POST /login` de la API).
- Guardado del token JWT en `localStorage` y envío automático como `Authorization: Bearer <token>`.
- Rutas protegidas: si no hay sesión, se redirige a `/login`.
- Gestión de items:
  - Listado (`GET /items`)
  - Detalle (`GET /items/{id}`)
  - Creación (`POST /items`)
  - Edición (`PUT /items/{id}`)
  - Eliminación (`DELETE /items/{id}`)
- Manejo de errores de la API (mensajes y errores por campo).
- `GET /me` para restaurar sesión y `POST /logout` para cerrarla en el servidor.

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior (probado con las versiones actuales).
- La API `progra4-api` en ejecución (requiere **PHP >= 8.1**).

## Puesta en marcha

### 1. Levantar la API

En otra terminal, dentro de `progra4-api`:

```powershell
php -S localhost:8000 -t public
```

La API quedará disponible en `http://localhost:8000`. Para usar, por ejemplo, el repositorio en memoria:

```powershell
$env:REPOSITORY_DRIVER='memory'
php -S localhost:8000 -t public
```

También se puede publicar sobre HTTPS con el proxy incluido (`make-cert.cmd` + `serve-https.cmd`).

### 2. Instalar dependencias del cliente

```powershell
npm install
```

### 3. Configurar la API a utilizar

El cliente resuelve la URL de la API a partir de la variable de entorno `VITE_API_URL`:

- **En desarrollo (npm run dev):** si no se define `VITE_API_URL`, todas las peticiones se envían a `/api` y el servidor de Vite las redirige (proxy) a `http://localhost:8000` mediante `vite.config.js`.
- **En cualquier otro caso,** `src/api/client.js` usa `VITE_API_URL` directamente como base de la API.

Formas de configurarla:

1. **Variable de entorno por terminal:**

   ```powershell
   $env:VITE_API_URL='http://localhost:8000'
   npm run dev
   ```

2. **Archivo `.env`** (crear desde una copia de `.env.example`):

   ```
   VITE_API_URL=http://localhost:8000
   ```

3. **Cambiar el destino del proxy** editando `vite.config.js` (opción `server.proxy['/api'].target`).

> Para un build de producción (`npm run build`) se usa el valor de `VITE_API_URL` del entorno. Si no se define, la aplicación esperará que la API esté servida bajo `/api` en el mismo dominio.

### 4. Ejecutar el cliente

```powershell
npm run dev
```

Abrir `http://localhost:5173`. Usuario de demostración: `admin` / `1234`.

## Demo de persistencia en el cliente

Accesible sin login en `/storage` (o desde el enlace **Demo persistencia** de la barra y de la página de acceso). Es la demostración que se usa en clase para la diapositiva *"Persistencia en el cliente: localStorage, sessionStorage y cookies"*.

En el formulario de **login/registro**, el selector **"¿Dónde guardar la sesión?"** elige dónde se persiste el token JWT. Cada modo corresponde a un mecanismo del navegador:

| Modo | Mecanismo | Comportamiento |
| --- | --- | --- |
| `localStorage` | `localStorage['progra4_token']` | Permanente hasta borrarlo (~5–10 MB). Sobrevive a recargar y cerrar la pestaña. |
| `sessionStorage` | `sessionStorage['progra4_token']` | Solo mientras la pestaña esté abierta (~5 MB). Se borra al cerrarla. |
| Cookie (JS) | `document.cookie['access_token']` con `Max-Age` | Legible/escrita por JS (~4 KB). Viaja sola con cada petición HTTP. |
| Cookie HttpOnly | `Set-Cookie: access_token; HttpOnly` (la API) | No legible por JS; la envía el navegador sola. Solo el servidor la borra con `POST /logout`. |

Detalles de implementación:

- El **modo elegido se guarda como preferencia** en `localStorage` (caso de uso "preferencias del usuario" de la diapositiva).
- En los modos cookie, el cliente **no envía** `Authorization: Bearer`; se demuestra que la cookie llega sola (fetch con `credentials: 'include'`).
- En el modo `cookie_httponly`, login/registro mandan `auth_cookie: true` y la API emite la cookie HttpOnly. Al recargar la SPA (que no puede leer la cookie), la sesión se restaura con `GET /me`; al cerrar sesión se llama a `POST /logout`.
- La página `/storage` muestra en vivo el contenido de cada almacén, ejecuta ejemplos idénticos a la diapositiva (`setItem` / `getItem` / `removeItem`, `document.cookie`) mostrando el código ejecutado, y permite limpiarlo todo.

### Requisitos de la API

La API debe incluir los endpoints y cabeceras de esta demo (ya implementados en `progra4-api`):

- `POST /logout` (borra la cookie), `GET /me` (valida sesión).
- `auth_cookie: true` en login/register para emitir la cookie HttpOnly.
- CORS con `Access-Control-Allow-Credentials: true` y origen en lista blanca (para que la cookie funcione entre `localhost:5173` y `localhost:8000`).

## Scripts disponibles

| Comando            | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `npm run dev`      | Inicia el servidor de desarrollo en el puerto 5173 |
| `npm run build`    | Genera el bundle de producción en `dist/`          |
| `npm run preview`  | Sirve localmente el bundle de producción           |
| `npm run lint`     | Ejecuta Oxlint sobre el código fuente              |

## Estructura del proyecto

```
src/
├── api/client.js          # Cliente HTTP (fetch) y manejo del JWT según el modo
├── auth/
│   ├── persistence.js     # Modos localStorage/sessionStorage/cookie/cookie_httponly
│   └── useAuth.jsx        # Contexto de autenticación (login/logout/register + /me)
├── components/
│   ├── Layout.jsx         # Barra de navegación y estructura base
│   ├── PersistenceSelector.jsx # Selector "¿dónde guardar la sesión?"
│   └── common.jsx         # Componentes reutilizables (alertas, spinner)
├── pages/
│   ├── Login.jsx          # Inicio de sesión (con selector de persistencia)
│   ├── Register.jsx       # Registro de cuenta (con selector de persistencia)
│   ├── ItemList.jsx       # Listado de items
│   ├── ItemDetail.jsx     # Detalle de un item
│   ├── ItemForm.jsx       # Crear / editar item (baja por formulario)
│   └── StorageDemo.jsx    # Demo didáctica de persistencia en el cliente
└── utils/format.js        # Formato de precios y errores
```