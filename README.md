# progra4-web

Cliente web (SPA) en **React + Vite** para la API [`progra4-api`](../progra4-api).

Permite crear una cuenta (`/register`), iniciar sesión con JWT (`/login`) y, una vez autenticado, administrar la entidad **item** con operaciones CRUD (listar, ver, crear, editar y eliminar).

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

Abrir `http://localhost:5173`. Usuario de demostración: `admin` / `qwerty67`.

### Probar desde un celular en la misma red WiFi

El servidor de desarrollo escucha en todas las interfaces (`server.host: true`
en `vite.config.js`). Con el celular conectado a la **misma red WiFi** que la PC:

1. Averiguar la IP local de la PC en la red WiFi:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object InterfaceAlias -eq 'Wi-Fi'
   ```
   (o `ipconfig` y buscar la IPv4 del adaptador WiFi, p. ej. `192.168.100.73`).
2. Abrir en el navegador del celular: `http://192.168.100.73:5173`.

Las peticiones a la API van por el proxy de Vite, que corre **en la PC**, así que
se resuelven contra `localhost:8000` sin configurar nada más.

> Si la primera vez no carga, aceptar el aviso de **Firewall de Windows**
> permitiendo el acceso en redes privadas al puerto 5173.

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
├── api/client.js          # Cliente HTTP (fetch) y manejo del JWT
├── auth/useAuth.jsx       # Contexto de autenticación (login/logout/register)
├── components/
│   ├── Layout.jsx         # Barra de navegación y estructura base
│   └── common.jsx         # Componentes reutilizables (alertas, spinner)
├── pages/
│   ├── Login.jsx          # Inicio de sesión
│   ├── Register.jsx       # Registro de cuenta
│   ├── ItemList.jsx       # Listado de items
│   ├── ItemDetail.jsx     # Detalle de un item
│   └── ItemForm.jsx       # Crear / editar item (baja por formulario)
└── utils/format.js        # Formato de precios y errores
```