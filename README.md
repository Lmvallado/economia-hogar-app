# Economía Hogar — Etapa 1

App web (PWA) para administrar la economía del hogar entre dos personas: gastos e ingresos del mes,
gastos por categoría y gastos fijos recurrentes. Estilo oscuro moderno, ARS y USD por separado.

Esta es la **Etapa 1** del plan: gastos e ingresos + dashboard básico + gastos fijos. Tarjetas/cuotas,
deudas y ahorro/metas quedan para las próximas etapas.

**App publicada:** https://lmvallado.github.io/economia-hogar-app/

## Qué incluye

- Login / registro con email y contraseña (Supabase Auth).
- Un "hogar" compartido: lo creás vos y tu pareja se une con un código de 6 caracteres.
- Carga rápida de movimientos (ingreso/gasto, ARS o USD, categoría, fecha, nota).
- Dashboard del mes: balance, ingresos, gastos y gastos por categoría (ARS y USD por separado).
- Listado de movimientos del mes, con quién lo cargó, y borrado.
- Gastos fijos recurrentes (alquiler, expensas, seguros) con un botón para cargarlos todos de un
  solo toque cada mes, sin duplicar los que ya estén cargados.
- Instalable como app en el celular (PWA), con ícono propio.

## Base de datos (Supabase)

Ya está creada y en uso: proyecto `economia-hogar`. El esquema completo (tablas, funciones y
seguridad RLS) está en [`supabase/schema.sql`](./supabase/schema.sql) por si hay que recrearlo o
revisarlo.

## Publicación (GitHub Pages, automática)

Cada `push` a `main` dispara [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), que
compila la app y la publica en GitHub Pages. No hace falta hacer nada manual para actualizar la app:
alcanza con subir cambios a `main`.

(La URL y la clave pública de Supabase están en el propio workflow — la clave "anon/publishable" es
segura para usar en el navegador, está pensada para eso.)

## Desarrollo local

```bash
npm install
cp .env.example .env
```

Editá `.env` y pegá la URL y la anon key del proyecto de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

```bash
npm run dev
```

## Estructura del proyecto

```
src/
  context/       Sesión (Supabase Auth) y hogar actual
  lib/           Cliente de Supabase, tipos, consultas a la base y formato de moneda
  components/    Shell (header + nav + botón +), modal de carga rápida, íconos
  pages/         Login, Onboarding (crear/unirse a hogar), Dashboard, Movimientos, Gastos fijos, Perfil
supabase/
  schema.sql     Todo el esquema de base de datos + seguridad, para pegar en Supabase
.github/workflows/
  deploy.yml     Build + publicación automática en GitHub Pages
```

## Próximas etapas (ya definidas en el documento de diseño)

- Etapa 2: tarjetas de crédito y cuotas, con proyección de próximos meses.
- Etapa 3: deudas y préstamos.
- Etapa 4: ahorro y metas, y dashboard completo con más gráficos.
