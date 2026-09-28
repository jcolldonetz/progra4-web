# progra4-web

Cliente web (SPA) en **React + Vite** para la API [`progra4-api`](../progra4-api).

Permite crear una cuenta (`/register`), iniciar sesión con JWT (`/login`) y, una vez autenticado, administrar la entidad **item** con operaciones CRUD (listar, ver, crear, editar y eliminar). Además puede **registrar pedidos** (`POST /pedidos`, el stock se descuenta) y recibe **notificaciones realtime**: a través de un WebSocket contra
[`progra4-notifications`](../progra4-notifications), cuando otro cliente hace un
pedido aparece un toast y el stock de la lista se actualiza **en vivo**, sin
recargar la página.

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
- Pedidos realtime (descuenta stock y avisa a los demás clientes):
  - Por cada fila/card un control "Pedir" con cantidad (`POST /pedidos`).
  - **Toast** cuando se registra un pedido (propio o de otro cliente).
  - **Stock en vivo**: `useRealtimeItems` aplica el evento `pedido.creado` a la
    lista sin refetch.
- Canal realtime conectado/desconectado según la sesión y **reconexión
  automática** con backoff (`src/services/realtime.js`).
- Manejo de errores de la API (mensajes y errores por campo).

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior (probado con las versiones actuales).
- La API `progra4-api` en ejecución (requiere **PHP >= 8.1**).
- **Opcional** (solo para el stock en vivo/los toasts): Redis y el server
  `progra4-notifications`. Sin ellos el CRUD y los pedidos funcionan igual; lo
  único que falta es el aviso en tiempo real a los otros clientes.

> ¿Vas a probar desde un celular en la misma red WiFi? Saltar directo a
> [Probar desde un celular en la misma red WiFi](#probar-desde-un-celular-en-la-misma-red-wifi),
> que tiene su propio checklist (firewall, IP, `VITE_API_URL`).

## Puesta en marcha

> Para ver los toasts y el stock en vivo, levantar **primero** Redis y el server
> de notificaciones (sección [Pedidos realtime](#pedidos-realtime-stock-en-vivo)
> abajo); si no, salta directo al paso 1.

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

Para que los pedidos se **publiquen** en el canal realtime, arrancarla con
`REDIS_URL` (equivalente al `JWT_SECRET` de la sección
[Pedidos realtime](#pedidos-realtime-stock-en-vivo)):

```powershell
$env:REDIS_URL='127.0.0.1:6379'; $env:JWT_SECRET='secreto-solo-para-desarrollo-cambiar'
php -S localhost:8000 -t public
```

También se puede publicar sobre HTTPS con el proxy incluido (`make-cert.cmd` + `serve-https.cmd`).

### 2. Instalar dependencias del cliente

```powershell
npm install
```

### 3. Configurar la API a utilizar

El cliente resuelve la URL de la API en `src/services/api.js`:

```js
const API_BASE = import.meta.env.VITE_API_URL || '/api'
```

- **Si `VITE_API_URL` NO está definida** (es el caso normal): todas las
  peticiones van a la ruta relativa `/api` y el servidor de Vite las reenvía a
  `http://localhost:8000` mediante el proxy de `vite.config.js`.
- **Si `VITE_API_URL` está definida**: se usa **directamente** como base de la
  API y el proxy de Vite queda sin usar.

Formas de configurarla:

1. **No hacer nada** (recomendado). Sin `.env` ni variables, el proxy cubre
   todo y sirve tanto para la PC como para el celular.

2. **Variable de entorno por terminal:**

   ```powershell
   $env:VITE_API_URL='http://localhost:8000'
   npm run dev
   ```

3. **Archivo `.env`** (crear desde una copia de `.env.example`):

   ```
   VITE_API_URL=http://localhost:8000
   ```

4. **Cambiar el destino del proxy** editando `API_POR_DEFECTO` en
   `vite.config.js` (opción `server.proxy['/api'].target`).

> `vite.config.js` lee la URL con `loadEnv()`, así que el destino del proxy
> respeta tanto el `.env` como las variables de la terminal: el proxy y el
> cliente no pueden quedar apuntando a lugares distintos.

> ⚠️ **No definas `VITE_API_URL` con `localhost` si vas a probar desde el
> celular.** Al quedar definida, el cliente se saltea el proxy y pide la API
> directamente; en el celular `localhost` es **el propio teléfono**, donde no
> hay nada escuchando. Ver la sección siguiente.

> Para un build de producción (`npm run build`) se usa el valor de
> `VITE_API_URL` del entorno. Si no se define, la aplicación esperará que la API
> esté servida bajo `/api` en el mismo dominio.

### 4. Ejecutar el cliente

```powershell
npm run dev
```

Abrir `http://localhost:5173`. Usuario de demostración: `admin` / `qwerty67`.

> **Reiniciar si ya estaba corriendo.** El proxy `/ws` con `ws:true` se agrega
> en `vite.config.js`; un `npm run dev` que seguía vivo desde antes del cambio
> no tiene ese proxy y el WebSocket fallaría al conectar.

## Pedidos realtime (stock en vivo)

El flujo completo usa los tres proyectos del workspace:

```
.tab A "Pedir"  ──▶ progra4-api (POST /pedidos, descuenta stock, publica en Redis)
                                                        │  canal "items.stock"
                                                        ▼
.tab B ◀── toast + stock en vivo ◀── WebSocket ◀── progra4-notifications (bridge + hub)
                              │           ▲
                              └─ Mismo WS pasando por el proxy /ws de Vite ─┘
```

Para que funcione hace falta levantar, en este orden:

1. **Redis** local (`127.0.0.1:6379`). En clase se usa el contenedor de Docker
   `progra4-redis` (ver README de [`progra4-notifications`](../progra4-notifications)).
2. **Server de notificaciones** (dentro de `progra4-notifications`):
   ```powershell
   php bin\notif-server.php      # ws://127.0.0.1:8081/ws
   ```
3. **API publicando eventos** (dentro de `progra4-api`, con `composer install`
   hecho una vez):
   ```powershell
   $env:REDIS_URL='127.0.0.1:6379'; $env:JWT_SECRET='secreto-solo-para-desarrollo-cambiar'
   php -S localhost:8000 -t public
   ```
4. **Este cliente** (`npm run dev`).

`JWT_SECRET` debe ser el **mismo** en la API y en el server de notificaciones:
el login emite el token, la API publica el evento y el WebSocket valida ese
mismo token (`?token=`). El cliente usa la **ruta relativa `/ws`** y el dev
server de Vite la reenvía a `http://localhost:8081` con `ws:true`
(`vite.config.js`); si la URL del server fuera distinta, se sobreescribe con la
variable `VITE_WS_URL` (ver `.env.example`).

Demo: abrir **dos ventanas** con la app, en la primera usar el botón "Pedir"
de un ítem, y ver cómo en la segunda baja el stock y aparece el toast — sin
recargar. Quien carga el pedido ve un toast **verde** de confirmación; los
demás ven el aviso **azul** "¡<usuario> pidió N × <ítem>!".

> **Para ver dos usuarios distintos a la vez**, abrí **una ventana normal y una
> de incógnito** (o dos navegadores/perfiles). Dos ventanas de incógnito
> comparten el mismo almacenamiento y no pueden tener sesiones distintas. La
> app guarda la sesión en memoria por ventana (`services/api.js`), así que
> durante la sesión de cada ventana el token que se ve en pantalla es
> exactamente el que se envía, pero al recargar se relee el almacenamiento
> compartido y gana la última sesión escrita.

## Probar desde un celular en la misma red WiFi

El flujo con un teléfono **no** es "el celular habla directo con la API", sino
esto:

```
celular  ──HTTP por WiFi──▶  dev server de Vite (PC, :5173)
                                └── proxy /api ──▶ API PHP (PC, :8000)
                                └── proxy /ws  ──▶ notificaciones (PC, :8081)   [realtime]
```

El WebSocket realtime usa el **mismo** proxy: el cliente conecta a
`ws://<IP>:5173/ws` y Vite lo reenvía con `ws:true`. O sea, para el realtime
desde el celular tampoco hace falta exponer el 8081 ni tocar
`CORS_ALLOWED_ORIGINS` del server de notificaciones (ese check los hace el
server WS solo cuando se le *conecta* otro origen; a través del proxy el origen
que ve es `http://localhost:5173`, que ya está en la lista blanca).

Todo lo que hay a la derecha corre **en la PC**: la API puede quedarse escuchando
solo en `localhost` y el celular nunca la ve. Por eso no hay CORS de por medio
(la petición sale del mismo origen, `http://<IP>:5173`) y el único puerto que
hay que abrir en el firewall es el **5173**.

### Requisitos

- Celular y PC conectados a la **misma red WiFi** (no sirve con datos móviles,
  ni con cellular, ni con una red "de invitados" que aísle los dispositivos).
- La red debe permitir comunicación entre dispositivos: algunos routers/AP con
  *AP isolation* o *client isolation* lo bloquean. Si `http://<IP>:5173` no
  abre desde el celular, ese es el primer suspecto.
- `vite.config.js` ya trae `server.host: true` y `server.strictPort: true`
  (este último para que, si el 5173 está ocupado, Vite avise en lugar de
  arrancar en el 5174 y desincronizar la URL del celular).

### Paso a paso

1. **No definas `VITE_API_URL`.** Si existe un `.env` con esa variable, comentala
   o borrala: el cliente tiene que usar la ruta relativa `/api` para que el
   proxy de Vite haga de puente.

2. **Levantar la API** (en una terminal, dentro de `progra4-api`):

   ```powershell
   php -S localhost:8000 -t public
   ```

   Queda en `http://localhost:8000`. Se puede dejar en `localhost` justamente
   para que no sea alcanzable desde la red.

3. **Levantar el cliente** (en otra terminal, dentro de `progra4-web`):

   ```powershell
   npm run dev
   ```

   Vite debe imprimir la URL de red, del tipo:

   ```
     ➜  Local:   http://localhost:5173/
     ➜  Network: http://192.168.100.73:5173/
   ```

   Esa línea `Network` es la URL a abrir en el celular.

4. **Obtener la IP de la PC** si Vite no la muestra, o para confirmar:

   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 |
     Where-Object { $_.InterfaceAlias -like '*Wi-Fi*' -or $_.InterfaceAlias -like '*Ethernet*' } |
     Where-Object { $_.IPAddress -notlike '127.*' } |
     Select-Object InterfaceAlias, IPAddress
   ```

   (o `ipconfig`, y buscar la IPv4 del adaptador WiFi/Ethernet, p. ej.
   `192.168.100.73`).

5. **Abrir en el navegador del celular:** `http://192.168.100.73:5173`
   (esquema `http://`, sin `https://`, sin barra final) e iniciar sesión con
   `admin` / `qwerty67`.

6. **Permitir el paso por el Firewall de Windows.** La primera vez Windows
   pregunta si se permite un proceso en redes privadas: aceptar para
   **Node.js** en redes **privadas**. Si la ventana de aviso no apareció, o se
   hizo clic en "Cancelar", se agrega la regla a mano (PowerShell como
   administrador):

   ```powershell
   New-NetFirewallRule -DisplayName "Vite dev (5173)" `
     -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5173 `
     -Profile Private
   ```

7. **Opcional: fijar la IP de la PC** con una dirección estática o una
   reserva DHCP, para no tener que cambiar la URL del celular cada vez que el
   router renueva la IP.

### Comprobar que la API responde a través del proxy

`/login` es público, así que alcanza sin token. La idea es pegarle a la **IP de
la red** (no a `localhost`) y por el **puerto del frontend** (no al de la API),
que es exactamente el camino que hace el celular:

```powershell
curl.exe -i -X POST -H "Content-Type: application/json" `
  -d '{"username":"admin","password":"qwerty67"}' http://192.168.100.73:5173/api/login
```

Si devuelve `200` con el token, el proxy está traduciendo bien `/api` y la
cadena completa funciona; entonces cualquier falla en el celular es del
firewall, del router o de la URL.

### Problemas frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| `No se pudo conectar con el servidor` | El firewall bloquea el 5173 | Aceptar/crear la regla de Inbound del punto 6 |
| La app carga pero el login falla | Hay un `.env` con `VITE_API_URL=http://localhost:8000` | Comentar la variable (paso 1) y reiniciar `npm run dev` |
| La página no abre desde el celular | AP/client isolation del router, o IP equivocada | Probar `ping <IP>` desde el celular; cambiar de red (hotspot del celular) |
| `403 Forbidden` | `vite.config.js` sin `host: true`, o el puerto no es el 5173 | Verificar que `npm run dev` muestre la línea `Network` |
| Carga y al refrescar da error 404 | Se está sirviendo `dist/` con un server estático | En desarrollo siempre usar `npm run dev` |

> Si en vez de la IP se usa un nombre de host (por ejemplo `http://mi-pc.local:5173`),
> Vite bloquea los nombres desconocidos como protección contra DNS rebinding. En
> ese caso agregar el host a `server.allowedHosts` en `vite.config.js`. Con
> direcciones IP no hace falta nada.

### HTTPS desde el celular (opcional, avanzado)

La variante `serve-https.cmd` de la API **no** sirve para el celular: el proxy
TLS (`https-proxy.php`) escucha solo en `127.0.0.1` y el certificado generado
por `make-cert.cmd` cubre únicamente `localhost`/`127.0.0.1`, así que la
conexión desde `192.168.x.x` sería rechazada. Para probar HTTPS en un teléfono
habría que exponer el proxy en `0.0.0.0` y regenerar el certificado con la IP de
la PC en el `subjectAltName` — se deja fuera porque el objetivo es la clase, no
la producción. En la práctica: HTTP por WiFi local para la demo, HTTPS detrás de
Nginx/Caddy o un túnel con CA pública.

### Alternativa: que el celular pegue directo a la API

No es lo recomendado (obliga a exponer la API en la red y a abrir CORS), pero
sirve para ver el caso "el browser llama a otro origen":

1. **Exponer la API en todas las interfaces** (en `progra4-api`):

   ```powershell
   php -S 0.0.0.0:8000 -t public
   ```

2. **Apuntar el cliente a la IP de la PC** (en `progra4-web/.env`):

   ```
   VITE_API_URL=http://192.168.100.73:8000
   ```

3. **Sumar el origen del celular a la lista blanca CORS de la API**, que por
   defecto solo acepta `localhost:5173` y `127.0.0.1:5173`:

   ```powershell
   # en progra4-api
   $env:CORS_ALLOWED_ORIGINS='http://localhost:5173,http://192.168.100.73:5173'
   php -S 0.0.0.0:8000 -t public
   ```

   (el origen es el del **frontend**, o sea el 5173, no el de la API)

4. **Abrir el puerto 8000** en el Firewall de Windows (además del 5173):

   ```powershell
   New-NetFirewallRule -DisplayName "progra4-api (8000)" `
     -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 `
     -Profile Private
   ```

Sin el paso 3 el navegador bloquea la respuesta y la consola muestra
`Access-Control-Allow-Origin` en el error.

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
├── main.jsx                  Punto de entrada (monta <RealtimeToasts /> arriba de las rutas)
├── services/
│   ├── api.js                Cliente HTTP (fetch), base de la API, manejo del JWT y api.pedidos
│   ├── realtime.js           Cliente WebSocket (reconexión con backoff, ?token=) — estado "externo"
│   └── itemsCache.js         Caché de items en memoria
├── stores/
│   ├── authStore.js          Estado de sesión (token + usuario)
│   └── realtimeStore.js      Estado del canal WS (useRealtime / connect / disconnect)
├── components/               Navbar, ItemList (con control "Pedir"), RealtimeToasts (toasts), formularios…
├── hooks/
│   ├── useConfirm.jsx        Hook del diálogo de confirmación
│   └── useRealtimeItems.jsx  Aplica los eventos "pedido.creado" al stock de la lista
├── pages/                    Login, Register, Dashboard, Items, Categories
└── index.css                 Estilos globales (incluye toasts y control de pedido)
```
