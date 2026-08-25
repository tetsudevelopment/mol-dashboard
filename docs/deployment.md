# Despliegue — MOLTECH Dashboard

Guía para desplegar el dashboard en un contenedor Docker.

> **Contexto**: este dashboard es una herramienta interna para probar el backend
> MOLTECH (`moltech_api`) y la app móvil. No es un panel de administración
> expuesto a usuarios finales.

---

## 1. Resumen operativo

| Concepto | Valor |
|---|---|
| Runtime | Node.js 24 (Alpine) |
| Framework | Next.js 16 (App Router), salida `standalone` |
| Puerto del contenedor | `3011` |
| Usuario | `nextjs` (uid 1001), no root |
| Liveness / readiness probe | `GET /api/health` |
| Entrypoint | `node server.js` |
| Filesystem | soporta root de solo lectura (ver §5) |

---

## 2. Variables de entorno — LEER ANTES DE CONSTRUIR

Esta es la parte que más problemas causa. Hay que entenderla.

Next.js **incrusta** (inlining) las variables con prefijo `NEXT_PUBLIC_` dentro
del bundle de JavaScript durante `next build`. No se leen en tiempo de
ejecución. Consecuencias:

1. **Son argumentos de build (`--build-arg`), no variables de runtime.**
   Pasarlas con `docker run -e` no tiene ningún efecto.
2. **Cada ambiente necesita su propia imagen.** Para apuntar a otro backend hay
   que reconstruir, no basta con reiniciar.
3. **El build falla si faltan.** `src/lib/env.ts` valida con Zod y lanza error.
   El `Dockerfile` corta antes con un mensaje explícito.

| Variable | Momento | Requerida | Default | Descripción |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | build | Sí | — | URL base del backend, **sin** slash final |
| `NEXT_PUBLIC_API_VERSION` | build | No | `v1` | Prefijo de versión de la API |
| `PORT` | runtime | No | `3011` | Puerto de escucha |
| `HOSTNAME` | runtime | No | `0.0.0.0` | Interfaz de escucha |
| `NODE_ENV` | runtime | No | `production` | — |

`NEXT_PUBLIC_API_URL` debe ser una URL válida y absoluta. El dashboard le
concatena `/api/${NEXT_PUBLIC_API_VERSION}` para armar las rutas.

Ejemplos válidos:

```
http://localhost:3010
https://backmolapi.vepay.com.co
```

---

## 3. Construir la imagen

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://backmolapi.vepay.com.co \
  --build-arg NEXT_PUBLIC_API_VERSION=v1 \
  -t moltech-dashboard:1.0.0 \
  -t moltech-dashboard:latest \
  .
```

**El build necesita salida a internet.** `next/font/google` descarga las
tipografías Geist durante `next build`. En un runner sin acceso a
`fonts.googleapis.com` el build falla.

Etiquetá la imagen por ambiente, ya que el backend queda fijo dentro del bundle:

```bash
# staging
docker build --build-arg NEXT_PUBLIC_API_URL=https://staging-api.example.com \
  -t moltech-dashboard:1.0.0-staging .

# producción
docker build --build-arg NEXT_PUBLIC_API_URL=https://backmolapi.vepay.com.co \
  -t moltech-dashboard:1.0.0-prod .
```

---

## 4. Ejecutar

### Docker

```bash
docker run -d \
  --name moltech-dashboard \
  --restart unless-stopped \
  -p 3011:3011 \
  moltech-dashboard:latest
```

Para publicar en otro puerto del host, solo cambia el lado izquierdo del mapeo
(el contenedor sigue escuchando en 3011):

```bash
docker run -d -p 8080:3011 moltech-dashboard:latest
```

Si necesitás cambiar el puerto interno:

```bash
docker run -d -e PORT=8080 -p 8080:8080 moltech-dashboard:latest
```

### Docker Compose

El repo trae un `docker-compose.yml` de referencia:

```bash
export NEXT_PUBLIC_API_URL=https://backmolapi.vepay.com.co
export HOST_PORT=3011          # opcional, default 3011
export IMAGE_TAG=1.0.0         # opcional, default latest

docker compose up -d --build
```

Al cambiar `NEXT_PUBLIC_API_URL` hay que reconstruir:

```bash
docker compose build --no-cache dashboard && docker compose up -d
```

---

## 5. Health check

`GET /api/health` responde `200` con:

```json
{
  "status": "ok",
  "service": "moltech-dashboard",
  "uptime_seconds": 24,
  "timestamp": "2026-08-25T21:29:01.394Z"
}
```

Características:

- No consulta el backend. Reporta únicamente si **este** servidor Next.js está
  atendiendo tráfico. Un backend caído deja al dashboard degradado, no muerto;
  hacer fallar el probe reiniciaría un contenedor sano.
- No requiere autenticación.
- Responde con `Cache-Control: no-store`.

> El estado del backend se muestra a personas en la página `/health` de la UI,
> que consulta `/api/v1/health/live` y `/api/v1/health/ready` del backend. Es
> una ruta distinta y con otro propósito — no la uses como probe.

La imagen ya declara un `HEALTHCHECK` propio, así que `docker ps` muestra
`healthy` / `unhealthy` sin configuración adicional.

### Filesystem de solo lectura

El contenedor corre con root de solo lectura en el `docker-compose.yml`. Como
`next/image` escribe variantes optimizadas en tiempo de ejecución, se monta un
`tmpfs` en `/app/.next/cache`. Si desplegás sin compose y con `--read-only`,
replicá ese montaje:

```bash
docker run -d --read-only \
  --tmpfs /tmp \
  --tmpfs /app/.next/cache:mode=1777 \
  -p 3011:3011 moltech-dashboard:latest
```

---

## 6. Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: moltech-dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: moltech-dashboard
  template:
    metadata:
      labels:
        app: moltech-dashboard
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
      containers:
        - name: dashboard
          image: moltech-dashboard:1.0.0-prod
          ports:
            - containerPort: 3011
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3011
            initialDelaySeconds: 15
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3011
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              memory: 512Mi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: next-cache
              mountPath: /app/.next/cache
      volumes:
        - name: tmp
          emptyDir: {}
        - name: next-cache
          emptyDir: {}
```

---

## 7. Proxy inverso

Next.js recomienda no exponer el servidor directamente a internet. Poné nginx,
Traefik o el ingress del clúster adelante para TLS, rate limiting y límites de
payload.

Ejemplo nginx:

```nginx
location / {
    proxy_pass         http://127.0.0.1:3011;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
}
```

---

## 8. Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| `ERROR: build arg NEXT_PUBLIC_API_URL is required` | Falta el `--build-arg` | Pasalo en el `docker build` |
| `Invalid public env vars: NEXT_PUBLIC_API_URL` | La URL no es absoluta o está vacía | Usá `https://host` completo |
| El build falla descargando fuentes | Runner sin salida a internet | Habilitá acceso a `fonts.googleapis.com` |
| El dashboard apunta al backend equivocado | La URL quedó incrustada en el bundle | Reconstruí la imagen; `-e` no sirve |
| Errores al optimizar imágenes con `--read-only` | Falta el tmpfs de caché | Montá `/app/.next/cache` |
| CORS al llamar al backend | El backend no permite el origen del dashboard | Ajustá CORS en `moltech_api` |
| `unhealthy` en `docker ps` | El servidor no arrancó | `docker logs moltech-dashboard` |

---

## 9. Verificación post-despliegue

```bash
# 1. El contenedor está sano
docker ps --filter name=moltech-dashboard --format '{{.Names}}\t{{.Status}}'

# 2. El probe responde
curl -sf http://localhost:3011/api/health && echo OK

# 3. La UI carga
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3011/

# 4. El bundle apunta al backend correcto
docker exec moltech-dashboard sh -c 'grep -rlo "https://backmolapi.vepay.com.co" .next/static | head -1'
```
