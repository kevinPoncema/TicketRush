# 🎟️ TicketRush - Frontend Web (Vue 3)

Frontend para la plataforma de ticketing B2B. Construido con Vue 3, TypeScript y Tailwind CSS.

## 🚀 Características

### Cliente (B2C)
- **Compra de Tickets**: Selección de eventos y compra de entradas.
- **Portal de Tickets**: Visualización de tickets comprados.
- **Recuperación**: Recuperación de compras mediante email y PIN de acceso.
- **Descarga de PDF**: Generación y descarga de PDFs con QR.

### Staff (B2B)
- **Panel de Staff**: Gestión de accesos al recinto.
- **Escáner de QR**: Validación criptográfica de tickets en tiempo real.
- **Reportes en Vivo**: Estadísticas de acceso y asistencia.

### Analíticas (Admin/Pro)
- **Dashboard Interactivo**: Métricas de ventas y asistencia.
- **Gráficos en Tiempo Real**: Visualización de tendencias con ApexCharts.

## 🏗️ Estructura del Proyecto

```
frontend/
├── src/
│   ├── api/            # Clientes HTTP para comunicarse con la API (axios)
│   ├── components/     # Componentes reutilizables (Botones, Modales, etc.)
│   ├── layouts/        # Estructuras de página (Navbar, Footer, AdminLayout)
│   ├── router/         # Configuración de Vue Router
│   ├── services/       # Lógica de negocio (Auth, Order, Events, etc.)
│   ├── views/
│   │   ├── b2c/        # Flujo de compra y usuario final
│   │   ├── b2b/        # Flujo de staff y staff
│   │   └── admin/      # Dashboard administrativo
│   └── App.vue         # Componente raíz
│
└── docker-compose.yml  # Configuración de contenedor (nginx + frontend)
```

## 🛠️ Tecnologías Utilizadas

- **Vue 3 (Composition API)**: Framework principal.
- **Vite**: Herramienta de construcción (Bundler).
- **Tailwind CSS**: Diseño UI utilitario.
- **Pinia**: Gestión de estado.
- **ApexCharts**: Gráficos analíticos.
- **qrcode.vue**: Generación de códigos QR.
- **axios**: Cliente HTTP.

## ⚙️ Configuración

### Variables de Entorno
Crear un archivo `.env` en la raíz del proyecto:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

### Variables Adicionales para Analytics (Opcional)
```bash
VITE_ANALYTICS_WS_URL=ws://localhost:3001
VITE_ANALYTICS_RECOVERY_INTERVAL=5000
```

## 🏃 Ejecución Local

1.  **Instalar dependencias**:
    ```bash
    cd frontend
    npm install
    ```

2.  **Iniciar el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    El proyecto estará disponible en [http://localhost:5173](http://localhost:5173).

## 🐳 Docker

Para construir y ejecutar el frontend usando Docker:

```bash
cd frontend

# Construir la imagen
docker build -t ticketrush-frontend .

# Ejecutar con docker-compose (asegúrate de que el backend corra en localhost:3000)
docker compose up
```

El frontend estará disponible en [http://localhost:3000](http://localhost:3000) (si el puerto 3000 no está en uso por otro servicio).
