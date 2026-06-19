# Hub Central CHC · Node.js + MySQL

Nueva versión autoadministrable del directorio de extensiones y ubicaciones de sucursales.

## Qué incluye

- Aplicación Node.js con Express.
- Base de datos MySQL.
- Página inicial `/` como Hub Central con accesos rápidos.
- Directorio público `/directorio` con búsqueda y filtros.
- Página pública `/ubicaciones` con tarjetas y botón **Cómo llegar**.
- Panel admin `/admin` para crear, editar y eliminar extensiones y ubicaciones.
- Asociación de extensión → ubicación para que las tarjetas de tipo `SUCURSAL` muestren **Cómo llegar** cuando tengan un enlace de Maps vinculado.
- Scripts SQL separados y un instalador completo.

## Credenciales iniciales del panel

- Usuario: `admin`
- Contraseña: `B1Admin`

Después de entrar, puedes cambiar la contraseña desde **Admin → Contraseña**.

## Instalación

1. Crea la base de datos e importa los datos:

```bash
mysql -u root -p < sql/00_full_install.sql
```

O por partes:

```bash
mysql -u root -p < sql/01_schema.sql
mysql -u root -p < sql/02_seed_locations.sql
mysql -u root -p < sql/03_seed_extensions.sql
mysql -u root -p < sql/04_seed_admin.sql
```

2. Copia el archivo de variables:

```bash
cp .env.example .env
```

3. Edita `.env` con tus credenciales de MySQL.

4. Instala dependencias y arranca:

```bash
npm install
npm start
```

Abre:

- Inicio: `http://localhost:3000/`
- Directorio: `http://localhost:3000/directorio`
- Ubicaciones: `http://localhost:3000/ubicaciones`
- Admin: `http://localhost:3000/admin`

## Datos incluidos

- Extensiones importadas desde el proyecto actual: **166**.
- Ubicaciones activas importadas desde tu página de ubicaciones: **122**.
- Ubicaciones pendientes importadas: **2**.

El seed de ubicaciones usa los enlaces de Google Maps (`maps_url`) y no depende de coordenadas.

## Cómo funciona el botón “Cómo llegar”

En el panel entra a **Extensiones**, edita una extensión de tipo `SUCURSAL` y selecciona una ubicación en el campo **Ubicación / sucursal para botón Cómo llegar**. Si esa ubicación tiene `maps_url`, la tarjeta pública de esa sucursal mostrará el botón.

## Notas de producción

- Cambia `SESSION_SECRET` en `.env`.
- Cambia la contraseña del usuario admin después de la primera entrada.
- Configura HTTPS si lo publicas fuera de red local.
- Para alto tráfico, conviene reemplazar el `MemoryStore` de sesiones por un store persistente.

## Cambio v5: mapa interactivo en el Hub

La página inicial ahora incluye un botón **Ver mapa** en la tarjeta de Ubicaciones. Abre un recuadro modal con buscador, filtro por municipio, lista de sucursales y vista previa de mapa. El botón **Cómo llegar** utiliza el `maps_url` guardado en la base de datos para abrir la ruta exacta en Google Maps.
