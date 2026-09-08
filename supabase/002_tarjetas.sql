-- Economía Hogar — Etapa 2: tarjetas de crédito y cuotas
-- Pegar este archivo en el SQL Editor de Supabase (del mismo proyecto donde ya corriste
-- schema.sql) y ejecutarlo. Es aditivo: no toca las tablas de la Etapa 1.

create table if not exists public.tarjetas (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares (id) on delete cascade,
  nombre text not null,
  color text not null default '#B9FF66',
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.compras_tarjeta (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares (id) on delete cascade,
  tarjeta_id uuid not null references public.tarjetas (id) on delete cascade,
  usuario_id uuid references public.perfiles (id) on delete set null,
  descripcion text not null,
  moneda text not null check (moneda in ('ARS', 'USD')),
  monto_cuota numeric(14, 2) not null check (monto_cuota > 0),
  cuotas_totales int not null check (cuotas_totales >= 1),
  primer_mes date not null,
  created_at timestamptz not null default now()
);

create index if not exists compras_tarjeta_hogar_idx on public.compras_tarjeta (hogar_id);

alter table public.tarjetas enable row level security;
alter table public.compras_tarjeta enable row level security;

drop policy if exists "tarjetas del hogar" on public.tarjetas;
create policy "tarjetas del hogar" on public.tarjetas
  for all using (hogar_id = public.mi_hogar_id())
  with check (hogar_id = public.mi_hogar_id());

drop policy if exists "compras tarjeta del hogar" on public.compras_tarjeta;
create policy "compras tarjeta del hogar" on public.compras_tarjeta
  for all using (hogar_id = public.mi_hogar_id())
  with check (hogar_id = public.mi_hogar_id());
