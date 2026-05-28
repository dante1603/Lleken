# Plan del Subproyecto DevOps - Evaluación Parcial N°2
**Asignatura:** Ingeniería DevOps (DOY0101) - Duoc UC
**Ponderación:** 45% del curso | **Plazo:** 5 semanas (Trabajo Autónomo / Taller)
**Objetivo:** Diseñar, contenerizar y automatizar el ciclo de vida (CI/CD) de la plataforma AgriTech **Lleken** mediante contenedores Docker, orquestación, pruebas automatizadas, escaneo de seguridad y despliegue simulado.

---

## 1. Ficha del Subproyecto y Objetivos

Este documento establece el diseño de arquitectura y la planificación operativa para el subproyecto de DevOps en **Lleken**. Servirá como la **única fuente de verdad técnica** para los desarrolladores y como el **contexto payload maestro** para que agentes de IA (como Claude) puedan redactar el informe final de la entrega con el menor índice de fricción posible.

### Indicadores de Logro a Satisfacer (Rúbrica)
*   **IE1 (Contenedores):** Crear Dockerfiles optimizados para el microservicio backend y frontend de Lleken.
*   **IE2 (Pruebas Automatizadas):** Ejecutar los tests de Vitest en el pipeline de CI/CD de GitHub Actions.
*   **IE3 (Seguridad y Escalabilidad):** Implementar Dependabot (análisis de dependencias) y Snyk (SAST/vulnerabilidades), configurando bloqueos ante fallos de seguridad graves.
*   **IE4 (Despliegue Automático & Trazabilidad):** Diseñar la entrega continua en un entorno simulado de nube o staging con trazabilidad de cambios.
*   **IE5 (Orquestación):** Diseñar y configurar la orquestación multi-contenedor mediante Docker Compose.

---

## 2. Mapeo de la Rúbrica con la Arquitectura de Lleken

Lleken es un excelente candidato porque posee componentes frontend y backend desacoplados, lo que permite implementar un ecosistema DevOps real:

| Indicador de Rúbrica | Componente/Tecnología en Lleken | Detalle de Implementación Técnica |
| :--- | :--- | :--- |
| **IE1: Contenedores** | Docker, Node.js 20, Nginx, Alpine Linux | Crear un `Dockerfile.backend` optimizado para Express y un `Dockerfile.frontend` multi-stage con Nginx para React. |
| **IE2: Pruebas Automatizadas** | Vitest (`vitest run`), ESLint, TypeScript | Ejecución de `npm run test` y `npm run lint` en el pipeline de GitHub Actions antes de compilar contenedores. |
| **IE3: Seguridad y Parámetros** | Snyk CLI, Dependabot, GitHub Secrets | Configuración de `.github/dependabot.yml` y escaneo SAST con Snyk en el pipeline de CI, bloqueando compilaciones inseguras. |
| **IE4: Despliegue Automático** | GitHub Actions workflows, GHCR / Docker Hub | Simulación de despliegue mediante compilación automática y simulación de deploy a staging usando contenedores orquestados. |
| **IE5: Orquestación** | Docker Compose (`docker-compose.yml`) | Ecosistema multi-contenedor que levanta e intercomunica la API de Express (puerto 8787) y el Frontend de React (puerto 3000). |

---

## 3. Especificación Técnica de los Componentes

### A. Contenerización (IE1)

Para lograr un "Muy Buen Desempeño" en el uso de contenedores, utilizaremos imágenes base ligeras (`alpine`), minimizaremos las capas y configuraremos seguridad sin privilegios de root (`non-root user`).

#### 1. Backend (API Express): `Dockerfile.backend`
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Compilar TypeScript si fuera necesario (Lleken usa tsx para correr directo, pero para prod podemos transpilar)
# RUN npm run build

# Stage 2: Runtime optimizado
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/server ./server
COPY --from=builder /app/api ./api

# Ejecutar como usuario no-root por seguridad
USER node

EXPOSE 8787
CMD ["node", "server/index.js"]
```

#### 2. Frontend (React + Vite + Tailwind v4): `Dockerfile.frontend`
```dockerfile
# Stage 1: Compilación
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Servidor Web de Producción
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
# Copiar configuración personalizada de Nginx para soportar React Router (Single Page App)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Custom Configuration (`nginx.conf`)
Para evitar que React Router devuelva errores 404 al refrescar rutas dinámicas, el frontend Nginx debe tener:
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

---

### B. Orquestación con Docker Compose (IE5)

Para orquestar el microservicio de manera escalable y segura, definiremos un entorno multi-contenedor en `docker-compose.yml` que soporte variables de entorno inyectadas.

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: lleken-backend
    ports:
      - "8787:8787"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - API_PORT=8787
    networks:
      - lleken-network
    restart: always

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: lleken-frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:8787
    networks:
      - lleken-network
    depends_on:
      - backend
    restart: always

networks:
  lleken-network:
    driver: bridge
```

---

### C. Pipeline de CI/CD en GitHub Actions (IE2, IE3 & IE4)

El pipeline de integración y entrega continua se definirá en `.github/workflows/ci-cd.yml` estructurado en etapas lógicas de calidad, seguridad, empaquetado y despliegue simulado:

```yaml
name: Lleken CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  # 1. Calidad y Robustez (IE2)
  quality-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Código
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Instalar Dependencias
        run: npm ci

      - name: Ejecutar Linter (Estática)
        run: tsc --noEmit

      - name: Ejecutar Pruebas Unitarias (IE2)
        run: npm run test

  # 2. Análisis de Seguridad con Bloqueo ante Fallos (IE3)
  security-scan:
    needs: quality-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Código
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Instalar Snyk CLI
        run: npm install -g snyk

      - name: Autenticar en Snyk
        run: snyk auth ${{ secrets.SNYK_TOKEN }}

      - name: Escaneo de Seguridad de Dependencias (Snyk Open Source)
        # snyk test fallará el pipeline de forma nativa si encuentra vulnerabilidades de severidad alta
        run: snyk test --severity-threshold=high

      - name: Escaneo de Código Estático (Snyk Code SAST)
        run: snyk code test --severity-threshold=high

  # 3. Construcción y Simulación de Despliegue (IE1 & IE4)
  build-and-deploy:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Código
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: actions/setup-docker-action@v1 # Simulación de Docker

      - name: Compilar Imagen Backend (IE1)
        run: |
          docker build -f Dockerfile.backend -t lleken-backend:latest .
          docker build -f Dockerfile.frontend -t lleken-frontend:latest .

      - name: Simulación de Despliegue en Entorno de Nube (IE4)
        run: |
          echo "Simulando Despliegue de Lleken en Staging..."
          echo "Verificando estado de contenedores en red virtual..."
          echo "Trazabilidad del Deploy de Git Commit: ${{ github.sha }}"
          echo "Despliegue Exitoso en Staging"
```

---

### D. Configuración de Dependabot (`.github/dependabot.yml`)

Para cumplir con el indicador **IE3** de escaneo automatizado de dependencias mediante Dependabot:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    reviewers:
      - "gardener-dante" # Nombre de usuario de GitHub de ejemplo

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 2
```

---

## 4. Guía de Ejecución Manual y Bitácora (Insumos para Claude)

*Esta sección contiene los pasos manuales detallados y las directrices para que **Claude** pueda redactar el informe técnico final con marcadores de posición exactos y descripciones de las capturas de pantalla requeridas.*

### A. Preparación Manual del Repositorio (Acciones del Estudiante)
Para que el pipeline funcione y se registre evidencia, el estudiante debe realizar a mano:
1.  **Crear cuenta en Snyk:** Registrarse de forma gratuita en [Snyk.io](https://snyk.io).
2.  **Obtener Token de Snyk:** Ir a Account Settings $\rightarrow$ Auth Token y copiar el valor.
3.  **Configurar Secret en GitHub:**
    *   Ir al repositorio en GitHub $\rightarrow$ Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions.
    *   Crear un nuevo Secret llamado `SNYK_TOKEN` y pegar el token obtenido.
4.  **Habilitar Dependabot:** Ir a Settings $\rightarrow$ Code security and analysis y asegurarse de activar Dependabot alerts.

---

### B. Estructura del Informe Final (Plantilla para Claude)

Cuando el estudiante le pase este archivo a Claude para redactar el informe, le pedirá que genere un documento estructurado de la siguiente forma:

1.  **Portada:** Título (Informe Técnico: Automatización y Orquestación de Lleken), Integrantes, Asignatura (DOY0101), Docente, Fecha.
2.  **Introducción:** Presentación de Lleken como plataforma AgriTech y el valor técnico de aplicar prácticas DevOps (CI/CD, Contenedores, QA y Seguridad).
3.  **Desarrollo del Encargo (Mapeado paso a paso con los Indicadores de Logro):**
    *   **IE1. Contenedores:** Explicación técnica de la optimización del Dockerfile del frontend (Nginx) y backend (Node-Alpine no-root).
        *   *Marcador de Captura 1:* `[Captura de pantalla de la terminal local ejecutando docker build -f Dockerfile.backend -t lleken-backend . sin errores]`.
    *   **IE2. Pruebas Automatizadas:** Explicación de la suite de tests unitarios de Vitest en Lleken y cómo GitHub Actions los ejecuta en cada push para evitar regresiones.
        *   *Marcador de Captura 2:* `[Captura de pantalla del pipeline en GitHub Actions mostrando el job 'quality-and-test' en verde (check exitoso) de Vitest]`.
    *   **IE3. Escalabilidad y Seguridad:** Detalle técnico de la configuración de Dependabot y el análisis SAST de Snyk para vulnerabilidades de dependencias y código de desarrollo. Explicación de la política de fallar la compilación si hay vulnerabilidades severas.
        *   *Marcador de Captura 3:* `[Captura de pantalla del escaneo de Snyk en GitHub Actions mostrando el reporte de seguridad o bloqueo de vulnerabilidades]`.
        *   *Marcador de Captura 4:* `[Captura del dashboard de Dependabot en GitHub con alertas o Pull Requests creados automáticamente]`.
    *   **IE4. Despliegue Automático y Trazabilidad:** Explicar cómo el pipeline de CI/CD automatiza los deploys en entornos controlados y cómo se garantiza la trazabilidad cruzando el Git Commit Hash con el log del despliegue.
        *   *Marcador de Captura 5:* `[Captura de pantalla de la ejecución completa y exitosa del workflow de GitHub Actions en la pestaña Actions]`.
    *   **IE5. Orquestación de Contenedores:** Detalle técnico de la intercomunicación entre contenedores definida en `docker-compose.yml`, el uso de la red puente `lleken-network` y la exposición de puertos para el frontend y backend.
        *   *Marcador de Captura 6:* `[Captura de pantalla de la terminal local ejecutando docker compose up y mostrando ambos contenedores activos y comunicándose]`.
4.  **Conclusiones y Reflexiones Individuales:** Secciones vacías para que cada estudiante redacte de forma autónoma (sin uso de IA, según indica la política académica del Duoc UC).

---

## 5. Arquitectura de Autenticación y Redirecciones (OAuth, Supabase & Vercel)

Un aspecto fundamental en la arquitectura híbrida de **Lleken** es la administración de la seguridad y el flujo de sesión del usuario. Durante las pruebas locales (incluso dentro de los contenedores Docker en `localhost:3000`), el comportamiento de inicio de sesión con Google OAuth opera bajo las siguientes reglas de redirección centralizadas:

### Flujo de Redirección OAuth:
1. **Inicio en Localhost:** El usuario accede a la pantalla de Login local en `http://localhost:3000/login` e inicia el flujo pulsando **"Continuar con Google"**.
2. **Autenticación Externa:** La petición viaja a través del cliente de Supabase hacia los servidores de autenticación de Google.
3. **Redirección Centralizada:** Al autenticarse correctamente, Supabase redirige al usuario de vuelta al dominio principal configurado como **Site URL** en el Dashboard de Supabase, que en este caso es el dominio productivo de Vercel: `https://lleken.vercel.app/home`.
4. **Administración en Supabase:** Este comportamiento de redirección es administrado y asegurado directamente desde la base de datos y configuración del Dashboard de Supabase en **Authentication -> URL Configuration**:
   - **Site URL:** `https://lleken.vercel.app` (Dominio maestro de producción en Vercel).
   - **Redirect URLs:** Configuración de patrones permitidos como `http://localhost:3000/**` para desarrollo y `https://lleken.vercel.app/**` para producción.

> [!NOTE]
> Este comportamiento garantiza que las sesiones de usuario y los tokens de acceso sean centralizados y verificados bajo el dominio seguro de producción en Vercel, permitiendo una transición transparente entre pruebas de contenedores locales y el ambiente en la nube.

---

## 6. Estado de Avance y Próximos Pasos

### Fase 1: Contenerización y Orquestación Local [COMPLETADA]
*   **Archivos creados y optimizados en el repositorio:**
    - `Dockerfile.backend` (Runtime Express corregido con tsx, copiando carpeta `src` y `tsconfig.json`, usuario `node` no-root).
    - `Dockerfile.frontend` (Compilación Vite y servidor web `nginx:alpine`).
    - `nginx.conf` (Configuración de ruteo SPA para Nginx).
    - `docker-compose.yml` (Orquestación multi-contenedor que lee `.env.local` automáticamente).
*   **Pruebas de Conectividad:** Ambos contenedores levantados exitosamente mediante Docker Compose, respondiendo en `http://localhost:3000` (Frontend) y `http://localhost:8787/api/health` (Backend: `{ ok: true }`).
*   **Responsable de la creación:** Antigravity AI.

---

### Próximos Pasos Recomendados (Para la Siguiente Sesión)
Cuando decidas retomar el proyecto, ejecuta las siguientes tareas:
1.  **Iniciar Fase 2 (Pipeline CI/CD y Dependabot):**
    - Crear la carpeta `.github/` con el subdirectorio `workflows/` y el archivo `ci-cd.yml` según el diseño técnico.
    - Colocar el archivo `.github/dependabot.yml` en la raíz.
    - Realizar un commit de prueba para activar el pipeline y depurar el flujo de Vitest y linter.

```
