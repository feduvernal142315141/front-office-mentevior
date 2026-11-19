# Pipeline de produccion

Este repo deja el ambiente dev en Vercel. GitHub Actions solo despliega produccion desde `main` o mediante ejecucion manual del workflow `Deploy production`.

## Que hace

1. Construye la imagen Docker usando el `Dockerfile` existente.
2. Publica la imagen en GitHub Container Registry con dos tags:
   - `ghcr.io/<owner>/<repo>:<commit-sha>`
   - `ghcr.io/<owner>/<repo>:production`
3. Se conecta al servidor de produccion por SSH.
4. Descarga la imagen nueva y reemplaza el contenedor productivo.

## Secrets requeridos

Configurar estos secrets en GitHub, preferiblemente dentro del environment `production`:

| Secret | Uso |
| --- | --- |
| `PROD_SSH_HOST` | Host o IP del servidor de produccion. |
| `PROD_SSH_USER` | Usuario SSH con permisos para ejecutar Docker. |
| `PROD_SSH_KEY` | Llave privada SSH para entrar al servidor. |
| `PROD_NEXT_PUBLIC_API_URL` | URL publica del backend de produccion, inyectada en el build de Next.js. |
| `PROD_BACKEND_API_URL` | URL del backend para llamadas server-side. Puede ser igual a `PROD_NEXT_PUBLIC_API_URL`. |

## Secrets opcionales

| Secret | Default |
| --- | --- |
| `PROD_SSH_PORT` | `22` |
| `PROD_APP_DIR` | `/opt/front-office-mentevior` |
| `PROD_CONTAINER_NAME` | `front-office-mentevior` |
| `PROD_HOST_PORT` | `3000` |
| `GHCR_USERNAME` | Usuario que ejecuta el workflow |
| `GHCR_TOKEN` | `GITHUB_TOKEN` del workflow |

Si el paquete de GHCR queda privado, el servidor necesita un token con permiso `read:packages` en `GHCR_TOKEN`.

## Requisitos del servidor

- Docker instalado.
- El usuario SSH debe poder ejecutar `docker` sin sudo interactivo.
- El puerto configurado en `PROD_HOST_PORT` debe estar disponible o proxied por Nginx/Caddy/Load Balancer.
