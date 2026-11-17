-- Tejido · esquema base (PRD §11)
-- Todas las tablas tienen RLS; las políticas están en 0003_rls.sql.

create extension if not exists pgcrypto;

-- ───────────── Tipos ─────────────
create type rol_app as enum (
  'admin','lider_eventos','doer_eventos','lider_impacto','marcom','datos','consulta'
);
create type tipo_hito as enum (
  'evento_externo','evento_propio','medios','ranking_premio','gremio_gobierno','accion_social','campana'
);
create type estado_hito as enum ('activo','en_pausa','descartado','cerrado');
create type semaforo as enum ('verde','ambar','rojo');
create type estado_etapa as enum ('pendiente','abierta','aprobada','omitida');
create type rol_vertical as enum ('protagonista','presente','no_va');
create type prioridad_pais as enum ('alta','media_alta','media','media_baja','baja');
create type estado_cifra as enum ('borrador','validada','vencida');
create type tipo_publicacion as enum ('ganado','propio','pagado');
create type estado_pago as enum ('pendiente','parcial','pagado');

-- ───────────── Usuarios ─────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null unique,
  rol rol_app not null default 'consulta',
  cargo text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table invitaciones (
  email text primary key check (email = lower(email)),
  rol rol_app not null,
  nombre text,
  invitado_por uuid references profiles(id),
  aceptada_en timestamptz,
  creado_en timestamptz not null default now()
);

-- ───────────── Catálogos ─────────────
create table paises (
  codigo char(2) primary key,
  nombre text not null,
  region text not null check (region in ('LATAM','Europa')),
  marca text not null check (marca in ('Dropi','Dropi Pro')),
  estado text not null,
  prioridad prioridad_pais not null,
  moneda char(3) not null,
  zona_horaria text not null,
  contacto_local text
);

create table monedas (
  codigo char(3) primary key,
  cop_por_unidad numeric not null check (cop_por_unidad > 0),
  usd_por_unidad numeric not null check (usd_por_unidad > 0)
);

create table ejes (
  id smallint primary key,
  slug text not null unique,
  nombre text not null,
  color text not null,
  kpi text not null
);

create table movilizadores (
  id smallint primary key,
  nombre text not null,
  orden smallint not null unique,
  icono text not null
);

create table etapas (
  id smallint primary key,
  nombre text not null,
  orden smallint not null unique,
  movilizador_id smallint references movilizadores(id),
  rol_dueno rol_app not null,
  roles_aprobadores rol_app[] not null,
  -- plazo sugerido: dias respecto a la fecha de inicio ('inicio') o de fin ('fin') del hito
  plazo_ref text not null check (plazo_ref in ('inicio','fin')),
  plazo_dias int,
  descripcion text
);

create table verticales (
  id serial primary key,
  nombre text not null unique,
  slug text not null unique,
  codigo char(4) not null unique,        -- para el código de evento (ROAX, PROV…)
  responsable text,
  reglas_calificacion jsonb not null default '{}'::jsonb,
  activa boolean not null default true
);

create table voceros (
  id serial primary key,
  nombre text not null,
  cargo text,
  temas text[] not null default '{}'
);

create table aliados (
  id serial primary key,
  nombre text not null,
  tipo text not null check (tipo in ('fundacion','gremio','gobierno','medio')),
  pais_codigo char(2) references paises(codigo),
  contacto text
);

create table tipos_hito (
  tipo tipo_hito primary key,
  nombre text not null,
  etapas_omitidas smallint[] not null default '{}',
  es_evento boolean not null default false,
  usa_captura boolean not null default false,
  es_social boolean not null default false
);

create table configuracion (
  clave text primary key,
  valor jsonb not null
);

-- ───────────── Hitos ─────────────
create table hitos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  tipo tipo_hito not null,
  eje_id smallint not null references ejes(id),
  ejes_secundarios smallint[] not null default '{}',
  fecha_inicio date not null,
  fecha_fin date not null,
  hora_inicio time,
  ciudad text,
  venue text,
  organizador text,
  url text,
  asistentes_estimados int,
  asistentes_reales int,
  moneda char(3) not null default 'COP' references monedas(codigo),
  etapa_id smallint not null default 0 references etapas(id),
  estado estado_hito not null default 'activo',
  motivo_estado text,
  semaforo semaforo not null default 'verde',
  responsable_id uuid references profiles(id),
  puntaje_evaluacion smallint,
  fecha_por_confirmar boolean not null default false,
  creado_por uuid references profiles(id),
  creado_en timestamptz not null default now(),
  check (fecha_fin >= fecha_inicio)
);
create index on hitos (fecha_inicio);
create index on hitos (etapa_id, estado);

create table hito_paises (
  hito_id uuid not null references hitos(id) on delete cascade,
  pais_codigo char(2) not null references paises(codigo),
  principal boolean not null default false,
  primary key (hito_id, pais_codigo)
);
create unique index hito_pais_principal on hito_paises (hito_id) where principal;

create table hito_asignaciones (
  hito_id uuid not null references hitos(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  funcion text not null default 'ejecucion',
  primary key (hito_id, user_id)
);

create table hito_verticales (
  hito_id uuid not null references hitos(id) on delete cascade,
  vertical_id int not null references verticales(id),
  pertinencia smallint not null default 3 check (pertinencia between 1 and 5),
  importancia smallint not null default 3 check (importancia between 1 and 5),
  rol rol_vertical not null default 'no_va',
  rol_confirmado boolean not null default false,
  audiencia_objetivo int,
  meta_leads int,
  participacion_costo numeric check (participacion_costo is null or participacion_costo between 0 and 1),
  primary key (hito_id, vertical_id)
);

create table hito_etapas (
  hito_id uuid not null references hitos(id) on delete cascade,
  etapa_id smallint not null references etapas(id),
  estado estado_etapa not null default 'pendiente',
  abierta_en timestamptz,
  vence_en timestamptz,
  aprobada_por uuid references profiles(id),
  aprobada_en timestamptz,
  comentario text,
  forzada boolean not null default false,
  motivo text,
  primary key (hito_id, etapa_id)
);

create table evaluaciones (
  hito_id uuid primary key references hitos(id) on delete cascade,
  audiencia smallint check (audiencia between 1 and 5),
  mercado smallint check (mercado between 1 and 5),
  mensaje smallint check (mensaje between 1 and 5),
  rol_posible smallint check (rol_posible between 1 and 5),
  costo_resultado smallint check (costo_resultado between 1 and 5),
  competencia smallint check (competencia between 1 and 5),
  total smallint generated always as (
    coalesce(audiencia,0)+coalesce(mercado,0)+coalesce(mensaje,0)+
    coalesce(rol_posible,0)+coalesce(costo_resultado,0)+coalesce(competencia,0)
  ) stored,
  notas text,
  actualizado_en timestamptz not null default now()
);

-- ───────────── Entregables genéricos por plantilla ─────────────
create table plantillas_entregables (
  id serial primary key,
  tipo_hito tipo_hito,                     -- null = aplica a todos los tipos
  etapa_id smallint not null references etapas(id),
  nombre text not null,
  campo text not null,
  obligatorio boolean not null default true,
  critico boolean not null default false,
  orden smallint not null default 0,
  unique (tipo_hito, etapa_id, campo)
);

create table entregables (
  id uuid primary key default gen_random_uuid(),
  hito_id uuid not null references hitos(id) on delete cascade,
  plantilla_id int not null references plantillas_entregables(id),
  valor jsonb,
  nota text,
  archivo_path text,
  responsable_id uuid references profiles(id),
  vence_en date,
  completo boolean not null default false,
  actualizado_en timestamptz not null default now(),
  unique (hito_id, plantilla_id)
);

-- ───────────── Datos ─────────────
create table cifras (
  id uuid primary key default gen_random_uuid(),
  eje_id smallint not null references ejes(id),
  pais_codigo char(2) references paises(codigo),
  enunciado text not null,
  valor numeric,
  valor_texto text,
  unidad text,
  fuente text not null,
  fecha_corte date not null,
  vigente_hasta date,
  estado estado_cifra not null default 'borrador',
  validada_por uuid references profiles(id),
  validada_en timestamptz,
  creado_en timestamptz not null default now()
);

create table hito_cifras (
  hito_id uuid not null references hitos(id) on delete cascade,
  cifra_id uuid not null references cifras(id) on delete cascade,
  primary key (hito_id, cifra_id)
);

-- ───────────── Narrativa ─────────────
create table narrativas (
  hito_id uuid primary key references hitos(id) on delete cascade,
  mensaje_clave text,
  vocero_id int references voceros(id),
  audiencia text,
  momento text,
  plan_medios text,
  aprobada boolean not null default false,
  actualizado_en timestamptz not null default now()
);

create table piezas (
  id uuid primary key default gen_random_uuid(),
  hito_id uuid not null references hitos(id) on delete cascade,
  tipo text not null check (tipo in ('charla','one_pager','post','nota_prensa','otra')),
  titulo text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','borrador','aprobada')),
  url text
);

-- ───────────── Evento ─────────────
create table stands (
  hito_id uuid primary key references hitos(id) on delete cascade,
  ancho_m numeric check (ancho_m > 0),
  fondo_m numeric check (fondo_m > 0),
  m2 numeric generated always as (round(coalesce(ancho_m,0) * coalesce(fondo_m,0), 2)) stored,
  tipo text,
  concepto text,
  proveedores text,
  cronograma_montaje text,
  plano_path text,
  renders text[] not null default '{}'
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  hito_id uuid not null references hitos(id) on delete cascade,
  concepto text not null,
  responsable_id uuid references profiles(id),
  vence_en date,
  critico boolean not null default false,
  completo boolean not null default false,
  creado_en timestamptz not null default now()
);

create table costos_items (
  id uuid primary key default gen_random_uuid(),
  hito_id uuid not null references hitos(id) on delete cascade,
  concepto text not null,
  proveedor text,
  valor numeric not null default 0,
  moneda char(3) not null default 'COP' references monedas(codigo),
  estado_pago estado_pago not null default 'pendiente',
  responsable_id uuid references profiles(id)
);

create table presupuestos (
  hito_id uuid primary key references hitos(id) on delete cascade,
  costo_estimado numeric,
  presupuesto_total numeric,
  costo_real numeric
);

-- ───────────── Captura de leads (solo plan y cifras agregadas) ─────────────
create table planes_captura (
  id uuid primary key default gen_random_uuid(),
  hito_id uuid not null references hitos(id) on delete cascade,
  vertical_id int not null references verticales(id),
  metodo text,
  destino_crm text,
  preguntas text,
  responsable text,
  seguimiento_horas int,
  meta int,
  aprobado boolean not null default false,
  unique (hito_id, vertical_id)
);

create table canales_captura (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references planes_captura(id) on delete cascade,
  codigo text not null,
  url_destino text not null,
  utm jsonb not null,
  url_final text not null,
  qr_path text,
  unique (plan_id)
);
create unique index canales_codigo_unico on canales_captura (codigo);

create table resultados_leads (
  hito_id uuid not null references hitos(id) on delete cascade,
  vertical_id int not null references verticales(id),
  capturados int not null default 0 check (capturados >= 0),
  calif_a int not null default 0 check (calif_a >= 0),
  calif_b int not null default 0 check (calif_b >= 0),
  calif_c int not null default 0 check (calif_c >= 0),
  existentes int not null default 0 check (existentes >= 0),
  registros int not null default 0 check (registros >= 0),
  activados_30d int not null default 0 check (activados_30d >= 0),
  fuente text not null default 'manual' check (fuente in ('manual','csv','api')),
  cargado_por uuid references profiles(id),
  cargado_en timestamptz not null default now(),
  primary key (hito_id, vertical_id),
  check (calif_a + calif_b + calif_c <= capturados)
);

-- ───────────── Social y medios ─────────────
create table acciones_sociales (
  hito_id uuid primary key references hitos(id) on delete cascade,
  aliado_id int references aliados(id),
  tipo text,
  beneficiarios int,
  equipos_entregados int,
  acta_path text
);

create table publicaciones (
  id uuid primary key default gen_random_uuid(),
  hito_id uuid not null references hitos(id) on delete cascade,
  medio text not null,
  pais_codigo char(2) references paises(codigo),
  tipo tipo_publicacion not null default 'ganado',
  url text,
  fecha timestamptz not null default now(),
  alcance int,
  tono text check (tono in ('positivo','neutral','negativo')),
  competidores text[] not null default '{}'
);

-- ───────────── Cierre, KPIs, auditoría, avisos ─────────────
create table cierres (
  hito_id uuid primary key references hitos(id) on delete cascade,
  aprendizajes text[] not null default '{}',
  notas text,
  cerrado_en timestamptz
);

create table kpi_metas (
  id serial primary key,
  trimestre text not null check (trimestre ~ '^[0-9]{4}-Q[1-4]$'),
  nivel text not null check (nivel in ('movilizador','eje','vertical','pais')),
  clave text not null,
  meta numeric not null,
  unique (trimestre, nivel, clave)
);

create table actividad (
  id bigserial primary key,
  user_id uuid,
  entidad text not null,
  entidad_id text,
  hito_id uuid,
  accion text not null,
  antes jsonb,
  despues jsonb,
  motivo text,
  creado_en timestamptz not null default now()
);
create index on actividad (hito_id, creado_en desc);

create table notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tipo text not null,
  hito_id uuid references hitos(id) on delete cascade,
  titulo text not null,
  detalle text,
  leida boolean not null default false,
  correo_enviado_en timestamptz,
  clave_unica text,
  creado_en timestamptz not null default now()
);
create unique index notificaciones_unica on notificaciones (user_id, clave_unica) where clave_unica is not null;
create index on notificaciones (user_id, leida, creado_en desc);
