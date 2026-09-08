# Economía Hogar — Etapa 2

App web (PWA) para administrar la economía del hogar entre dos personas: gastos e ingresos del mes,
gastos por categoría, gastos fijos recurrentes, y tarjetas de crédito con cuotas y proyección de
próximos meses. Estilo oscuro moderno, ARS y USD por separado.

**App publicada:** https://lmvallado.github.io/economia-hogar-app/

## Qué incluye

- Login / registro con email y contraseña (Supabase Auth).
- Un "hogar" compartido: lo creás vos y tu pareja se une con un código de 6 caracteres.
- Carga rápida de movimientos (ingreso/gasto, ARS o USD, categoría, fecha, nota).
- Dashboard del mes: balance, ingresos, gastos y gastos por categoría (ARS y USD por separado).
- Listado de movimientos del mes, con quién lo cargó, y borrado.
- Gastos fijos recurrentes (alquiler, expensas, seguros) con un botón para cargarlos todos de un
  solo toque cada mes, sin duplicar los que ya estén cargados.
- **Tarjetas de crédito y cuotas (Etapa 2):** cargá tus tarjetas y las compras en cuotas (monto
  total + cantidad de cuotas), y mirá cuánto vas a deber cada uno de los próximos 6 meses, en ARS
  y USD por separado. No se mezcla automáticamente con los movimientos del mes — es una proyección
  aparte, para saber qué se viene.
- Instalable como app en el celular (PWA), con ícono propio.

## Base de datos (Supabase)

Ya está creada y en uso: proyecto `economia-hogar`.

- [`supabase/schema.sql`](./supabase/schema.sql) — esquema de la Etapa 1 (movimientos, gastos fijos).
- [`supabase/002_tarjetas.sql`](./supabase/002_tarjetas.sql) — agregado de la Etapa 2 (tarjetas y
  compras en cuotas). Es aditivo: se pega y ejecuta en el mismo proyecto, sin tocar lo anterior.

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
  lib/           Cliente de Supabase, tipos, consultas a la base, formato de moneda y cálculo de cuotas
  components/    Shell (header + nav + botón +), modal de carga rápida, íconos
  pages/         Login, Onboarding (crear/unirse a hogar), Dashboard, Movimientos, Tarjetas,
                 Gastos fijos, Perfil
supabase/
  schema.sql        Esquema de la Etapa 1
  002_tarjetas.sql  Agregado de la Etapa 2 (tarjetas y cuotas)
.github/workflows/
  deploy.yml     Build + publicación automática en GitHub Pages
```

## Próximas etapas (ya definidas en el documento de diseño)

- Etapa 3: deudas y préstamos.
- Etapa 4: ahorro y metas, y dashboard completo con más gráficos.
