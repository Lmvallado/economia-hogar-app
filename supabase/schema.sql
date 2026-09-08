-- Economía Hogar — esquema inicial (Etapa 1: gastos e ingresos + dashboard)
-- Pegar este archivo completo en el SQL Editor de Supabase (Proyecto > SQL Editor > New query) y ejecutar.

create extension if not exists pgcrypto;

-- ============ TABLAS ============

create table if not exists public.hogares (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo_invitacion text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at timestamptz not null default now()
);

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  hogar_id uuid references public.hogares (id) on delete set null,
  nombre text not null default 'Sin nombre',
  created_at timestamptz not null default now()
);

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares (id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  color text not null default '#B9FF66',
  orden int not null default 0
);

create table if not exists public.movimientos (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares (id) on delete cascade,
  usuario_id uuid references public.perfiles (id) on delete set null,
  categoria_id uuid references public.categorias (id) on delete set null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  monto numeric(14, 2) not null check (monto > 0),
  moneda text not null check (moneda in ('ARS', 'USD')),
  fecha date not null default current_date,
  es_fijo boolean not null default false,
  nota text,
  created_at timestamptz not null default now()
);

create table if not exists public.gastos_fijos (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  nombre text not null,
  monto numeric(14, 2) not null check (monto > 0),
  moneda text not null check (moneda in ('ARS', 'USD')),
  activo boolean not null default true
);

create index if not exists movimientos_hogar_fecha_idx on public.movimientos (hogar_id, fecha desc);

-- ============ FUNCIÓN AUXILIAR: hogar del usuario actual ============
-- security definer para evitar recursión de RLS al leer el propio perfil.

create or replace function public.mi_hogar_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hogar_id from public.perfiles where id = auth.uid();
$$;

grant execute on function public.mi_hogar_id() to authenticated;

-- ============ ALTA AUTOMÁTICA DE PERFIL AL REGISTRARSE ============

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ CREAR / UNIRSE A UN HOGAR ============

create or replace function public.crear_hogar(p_nombre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hogar_id uuid;
begin
  insert into public.hogares (nombre) values (p_nombre) returning id into v_hogar_id;
  update public.perfiles set hogar_id = v_hogar_id where id = auth.uid();

  insert into public.categorias (hogar_id, nombre, tipo, color, orden) values
    (v_hogar_id, 'Supermercado', 'gasto', '#B9FF66', 1),
    (v_hogar_id, 'Servicios', 'gasto', '#B9FF66', 2),
    (v_hogar_id, 'Nafta', 'gasto', '#B9FF66', 3),
    (v_hogar_id, 'Salidas', 'gasto', '#B9FF66', 4),
    (v_hogar_id, 'Salud', 'gasto', '#B9FF66', 5),
    (v_hogar_id, 'Otros gastos', 'gasto', '#B9FF66', 6),
    (v_hogar_id, 'Sueldo', 'ingreso', '#93C5FD', 1),
    (v_hogar_id, 'Otros ingresos', 'ingreso', '#93C5FD', 2);

  return v_hogar_id;
end;
$$;

grant execute on function public.crear_hogar(text) to authenticated;

create or replace function public.unirse_a_hogar(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hogar_id uuid;
begin
  select id into v_hogar_id from public.hogares where codigo_invitacion = upper(trim(p_codigo));

  if v_hogar_id is null then
    raise exception 'No existe ningún hogar con ese código de invitación';
  end if;

  update public.perfiles set hogar_id = v_hogar_id where id = auth.uid();

  return v_hogar_id;
end;
$$;

grant execute on function public.unirse_a_hogar(text) to authenticated;

-- ============ ROW LEVEL SECURITY ============

alter table public.hogares enable row level security;
alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.movimientos enable row level security;
alter table public.gastos_fijos enable row level security;

-- hogares: cada uno ve solo el suyo (el alta/unión se hace vía las funciones de arriba)
drop policy if exists "ver mi hogar" on public.hogares;
create policy "ver mi hogar" on public.hogares
  for select using (id = public.mi_hogar_id());

-- perfiles: veo el mío y el de quienes comparten mi hogar (para saber quién cargó cada gasto)
drop policy if exists "ver perfiles de mi hogar" on public.perfiles;
create policy "ver perfiles de mi hogar" on public.perfiles
  for select using (id = auth.uid() or hogar_id = public.mi_hogar_id());

drop policy if exists "editar mi perfil" on public.perfiles;
create policy "editar mi perfil" on public.perfiles
  for update using (id = auth.uid());

-- categorías: todo lo del hogar
drop policy if exists "categorias del hogar" on public.categorias;
create policy "categorias del hogar" on public.categorias
  for all using (hogar_id = public.mi_hogar_id())
  with check (hogar_id = public.mi_hogar_id());

-- movimientos: todo lo del hogar (economía compartida); se guarda igual quién lo cargó
drop policy if exists "movimientos del hogar" on public.movimientos;
create policy "movimientos del hogar" on public.movimientos
  for select using (hogar_id = public.mi_hogar_id());

drop policy if exists "cargar movimientos" on public.movimientos;
create policy "cargar movimientos" on public.movimientos
  for insert with check (hogar_id = public.mi_hogar_id() and usuario_id = auth.uid());

drop policy if exists "editar movimientos del hogar" on public.movimientos;
create policy "editar movimientos del hogar" on public.movimientos
  for update using (hogar_id = public.mi_hogar_id())
  with check (hogar_id = public.mi_hogar_id());

drop policy if exists "borrar movimientos del hogar" on public.movimientos;
create policy "borrar movimientos del hogar" on public.movimientos
  for delete using (hogar_id = public.mi_hogar_id());

-- gastos fijos: todo lo del hogar
drop policy if exists "gastos fijos del hogar" on public.gastos_fijos;
create policy "gastos fijos del hogar" on public.gastos_fijos
  for all using (hogar_id = public.mi_hogar_id())
  with check (hogar_id = public.mi_hogar_id());
