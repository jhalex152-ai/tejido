-- Tejido · datos semilla (PRD §11). Se puede ejecutar varias veces.

-- ───── Ejes y movilizadores ─────
insert into ejes (id, slug, nombre, color, kpi) values
  (1, 'ecommerce',        'E-commerce',         '#FF9D38', 'Activaciones desde eventos'),
  (2, 'tecnologia',       'Tecnología',         '#38BDF8', 'Presencia en rankings y relación con founders / VCs'),
  (3, 'gremios_gobierno', 'Gremios y gobierno', '#A78BFA', 'Afiliaciones y mesas activas'),
  (4, 'social',           'Social',             '#34D399', 'Alianzas RSE activas')
on conflict (id) do update set nombre = excluded.nombre, color = excluded.color, kpi = excluded.kpi;

insert into movilizadores (id, nombre, orden, icono) values
  (1, 'Datos', 1, 'database'), (2, 'Narrativa', 2, 'message-circle'),
  (3, 'Eventos', 3, 'users'),  (4, 'Medios', 4, 'send')
on conflict (id) do nothing;

-- ───── Etapas (plazo respecto al inicio o al fin del hito) ─────
insert into etapas (id, nombre, orden, movilizador_id, rol_dueno, roles_aprobadores, plazo_ref, plazo_dias, descripcion) values
  (0, 'Radar',        0, null, 'admin',         '{admin,lider_eventos,lider_impacto,marcom}', 'inicio', null, 'Ficha completa'),
  (1, 'Evaluación',   1, null, 'admin',         '{admin}',                                   'inicio', -30,  'Puntaje ≥ 18/30 y aprobación del Head'),
  (2, 'Datos',        2, 1,    'datos',         '{admin,datos}',                             'inicio', -21,  'Datos marca la cifra como validada para vocería'),
  (3, 'Narrativa',    3, 2,    'marcom',        '{admin}',                                   'inicio', -14,  'Head aprueba mensaje y vocero'),
  (4, 'Preparación',  4, 3,    'lider_eventos', '{admin,lider_eventos,lider_impacto}',       'inicio', -3,   'Checklist crítico al 100% y plan de captura aprobado por vertical'),
  (5, 'Ejecución',    5, 3,    'lider_eventos', '{admin,lider_eventos,lider_impacto}',       'fin',    0,    'Fin del evento y asistencia real registrada'),
  (6, 'Amplificación',6, 4,    'marcom',        '{admin,marcom}',                            'fin',    2,    'Primera publicación ≤ 48 h tras el evento'),
  (7, 'Cierre y medición', 7, null, 'datos',    '{admin}',                                   'fin',    35,   'Head o Transversal cierra el hito')
on conflict (id) do update set roles_aprobadores = excluded.roles_aprobadores, plazo_dias = excluded.plazo_dias,
  plazo_ref = excluded.plazo_ref, rol_dueno = excluded.rol_dueno;

-- ───── Tipos de hito ─────
insert into tipos_hito (tipo, nombre, etapas_omitidas, es_evento, usa_captura, es_social) values
  ('evento_externo',  'Evento externo',          '{}',    true,  true,  false),
  ('evento_propio',   'Evento propio',           '{}',    true,  true,  false),
  ('medios',          'Aparición en medios',     '{4,5}', false, false, false),
  ('ranking_premio',  'Ranking o premio',        '{4,5}', false, false, false),
  ('gremio_gobierno', 'Gremio o mesa de gobierno','{4,5}',false, false, false),
  ('accion_social',   'Acción social',           '{}',    false, false, true),
  ('campana',         'Campaña',                 '{4,5}', false, false, false)
on conflict (tipo) do update set etapas_omitidas = excluded.etapas_omitidas, es_evento = excluded.es_evento,
  usa_captura = excluded.usa_captura, es_social = excluded.es_social;

-- ───── Monedas (tasas REFERENCIALES: actualízalas en Administración) ─────
insert into monedas (codigo, cop_por_unidad, usd_por_unidad) values
  ('COP', 1, 0.00025), ('USD', 4000, 1), ('EUR', 4400, 1.1), ('MXN', 220, 0.055), ('VES', 100, 0.025),
  ('CLP', 4.2, 0.00105), ('PEN', 1070, 0.267), ('GTQ', 515, 0.129), ('ARS', 4, 0.001), ('PYG', 0.52, 0.00013),
  ('CRC', 7.8, 0.00195), ('RON', 880, 0.22), ('PLN', 960, 0.24), ('HUF', 10.8, 0.0027), ('CZK', 170, 0.0425)
on conflict (codigo) do nothing;

-- ───── 22 países ─────
insert into paises (codigo, nombre, region, marca, estado, prioridad, moneda, zona_horaria) values
  ('CO','Colombia','LATAM','Dropi','Mercado madre, sede en Cali','alta','COP','America/Bogota'),
  ('MX','México','LATAM','Dropi','Segundo catálogo más grande','alta','MXN','America/Mexico_City'),
  ('VE','Venezuela','LATAM','Dropi','Lanzamiento reciente','media_alta','VES','America/Caracas'),
  ('CL','Chile','LATAM','Dropi','Consolidado o en expansión','media','CLP','America/Santiago'),
  ('EC','Ecuador','LATAM','Dropi','Consolidado o en expansión','media','USD','America/Guayaquil'),
  ('PE','Perú','LATAM','Dropi','Consolidado o en expansión','media','PEN','America/Lima'),
  ('PA','Panamá','LATAM','Dropi','Consolidado o en expansión','media','USD','America/Panama'),
  ('GT','Guatemala','LATAM','Dropi','Consolidado o en expansión','media','GTQ','America/Guatemala'),
  ('AR','Argentina','LATAM','Dropi','Expansión (con Droplatam)','media_baja','ARS','America/Argentina/Buenos_Aires'),
  ('PY','Paraguay','LATAM','Dropi','Expansión','media_baja','PYG','America/Asuncion'),
  ('CR','Costa Rica','LATAM','Dropi','Expansión','media_baja','CRC','America/Costa_Rica'),
  ('ES','España','Europa','Dropi Pro','Mercado más maduro de Europa','media','EUR','Europe/Madrid'),
  ('PT','Portugal','Europa','Dropi Pro','Mercado más maduro de Europa','media','EUR','Europe/Lisbon'),
  ('RO','Rumanía','Europa','Dropi Pro','Operación','baja','RON','Europe/Bucharest'),
  ('PL','Polonia','Europa','Dropi Pro','Operación','baja','PLN','Europe/Warsaw'),
  ('HU','Hungría','Europa','Dropi Pro','Operación','baja','HUF','Europe/Budapest'),
  ('SI','Eslovenia','Europa','Dropi Pro','Operación','baja','EUR','Europe/Ljubljana'),
  ('SK','Eslovaquia','Europa','Dropi Pro','Operación','baja','EUR','Europe/Bratislava'),
  ('HR','Croacia','Europa','Dropi Pro','Operación','baja','EUR','Europe/Zagreb'),
  ('GR','Grecia','Europa','Dropi Pro','Operación','baja','EUR','Europe/Athens'),
  ('BG','Bulgaria','Europa','Dropi Pro','Operación','baja','EUR','Europe/Sofia'),
  ('CZ','República Checa','Europa','Dropi Pro','Operación','baja','CZK','Europe/Prague')
on conflict (codigo) do nothing;

-- ───── Verticales (catálogo editable) y reglas A/B/C de referencia para el CRM ─────
insert into verticales (nombre, slug, codigo, reglas_calificacion) values
  ('Dropshippers', 'dropshippers', 'DROP', '{"A":"Ya vende en línea","B":"Quiere empezar en menos de 30 días","C":"Curiosidad"}'),
  ('Proveedores', 'proveedores', 'PROV', '{"A":"Fabricante o importador con inventario propio","B":"Distribuidor","C":"Sin producto"}'),
  ('Marcas propias', 'marcas-propias', 'MARC', '{}'),
  ('Logística y Fulfillment', 'logistica-fulfillment', 'LOGI', '{}'),
  ('Dropi Academy', 'dropi-academy', 'ACAD', '{}'),
  ('ROAX', 'roax', 'ROAX', '{"A":"Tienda activa con pauta o volumen de pedidos","B":"Tienda nueva","C":"Sin tienda"}'),
  ('Chatea Pro', 'chatea-pro', 'CHAT', '{"A":"Tienda activa con pauta o volumen de pedidos","B":"Tienda nueva","C":"Sin tienda"}'),
  ('DropiPay', 'dropipay', 'DPAY', '{}'),
  ('ConfioPagos', 'confiopagos', 'CONF', '{}'),
  ('Vibe', 'vibe', 'VIBE', '{}'),
  ('Dropi Pro', 'dropi-pro', 'DPRO', '{}')
on conflict (slug) do nothing;

-- ───── Configuración ─────
insert into configuracion (clave, valor) values
  ('semaforo_umbrales', '{"verde": 90, "ambar": 60}'),
  ('dias_alerta_roja', '7'),
  ('ventana_amplificacion_horas', '48')
on conflict (clave) do nothing;

-- ───── Plantillas de entregables por tipo de hito y etapa ─────
insert into plantillas_entregables (tipo_hito, etapa_id, nombre, campo, obligatorio, critico, orden) values
  ('evento_externo', 2, 'Línea base de leads de eventos similares', 'linea_base', true, false, 1),
  ('evento_propio',  2, 'Línea base de leads de eventos similares', 'linea_base', true, false, 1),
  ('evento_externo', 5, 'Vocería ejecutada (sí/no)', 'voceria_ejecutada', true, false, 1),
  ('evento_propio',  5, 'Vocería ejecutada (sí/no)', 'voceria_ejecutada', true, false, 1),
  ('evento_externo', 5, 'Fotos y video cargados', 'fotos_video', true, false, 2),
  ('evento_propio',  5, 'Fotos y video cargados', 'fotos_video', true, false, 2),
  ('evento_externo', 5, 'Incidencias (o "ninguna")', 'incidencias', false, false, 3),
  ('evento_propio',  5, 'Incidencias (o "ninguna")', 'incidencias', false, false, 3),
  ('accion_social',  4, 'Fundación aliada confirmada', 'fundacion', true, true, 1),
  ('accion_social',  4, 'Beneficiarios definidos', 'beneficiarios', true, false, 2),
  ('accion_social',  4, 'Equipos a entregar', 'equipos', true, false, 3),
  ('accion_social',  5, 'Acta firmada', 'acta', true, false, 1)
on conflict (tipo_hito, etapa_id, campo) do nothing;

-- ───── Hitos Q4 2026 (las etapas iniciales son una propuesta: el equipo las ajusta al cargar) ─────
create or replace function _seed_hito(
  p_nombre text, p_slug text, p_tipo tipo_hito, p_eje smallint, p_ini date, p_fin date,
  p_pais text, p_ciudad text, p_venue text, p_etapa smallint, p_por_confirmar boolean default false
) returns void language plpgsql as $$
declare v_id uuid;
begin
  if exists (select 1 from hitos where slug = p_slug) then return; end if;
  perform set_config('tejido.interno', 'on', true);
  insert into hitos (nombre, slug, tipo, eje_id, fecha_inicio, fecha_fin, ciudad, venue, fecha_por_confirmar)
  values (p_nombre, p_slug, p_tipo, p_eje, p_ini, p_fin, p_ciudad, p_venue, p_por_confirmar)
  returning id into v_id;
  insert into hito_paises (hito_id, pais_codigo, principal) values (v_id, p_pais, true);

  update hito_etapas set estado = 'aprobada', aprobada_en = now(), motivo = 'Carga inicial (semilla)'
   where hito_id = v_id and etapa_id < p_etapa and estado <> 'omitida';
  update hito_etapas set estado = 'abierta', abierta_en = now() where hito_id = v_id and etapa_id = p_etapa;
  update hitos set etapa_id = p_etapa where id = v_id;
  if p_etapa > 3 then update narrativas set aprobada = true where hito_id = v_id; end if;
end $$;

select _seed_hito('Plaza de Wein',        'plaza-de-wein-2026',   'evento_externo', 1::smallint, '2026-12-12', '2026-12-20', 'CO', 'Medellín', null, 1::smallint, true);
select _seed_hito('Modo Ascenso',         'modo-ascenso-2026',    'evento_externo', 2::smallint, '2026-11-28', '2026-11-28', 'CO', 'Cali', 'Icesi', 3::smallint);
select _seed_hito('Elevate (comunidad Ecomwom)', 'elevate-2026',  'evento_externo', 4::smallint, '2026-11-26', '2026-11-26', 'CO', null, 'CESA', 3::smallint);
select _seed_hito('Leyendas',             'leyendas-2026',        'evento_externo', 4::smallint, '2026-11-24', '2026-11-24', 'CO', null, null, 3::smallint, true);
select _seed_hito('Finfest (DropiPay y Confío)', 'finfest-2026',  'evento_externo', 2::smallint, '2026-11-22', '2026-11-22', 'CO', null, null, 3::smallint, true);
select _seed_hito('Despega',              'despega-2026',         'evento_externo', 1::smallint, '2026-11-13', '2026-11-15', 'CO', null, 'Zonamerica', 6::smallint);
select _seed_hito('Labs Summit',          'labs-summit-2026',     'evento_externo', 1::smallint, '2026-10-28', '2026-10-30', 'CO', 'Tuluá', null, 7::smallint);
select _seed_hito('Revista Semana',       'revista-semana-2026',  'medios',         1::smallint, '2026-10-24', '2026-10-24', 'CO', null, null, 7::smallint);
select _seed_hito('Entrega de computadores (fundación de Taliana Vargas)', 'entrega-computadores-2026', 'accion_social', 4::smallint, '2026-12-15', '2026-12-15', 'CO', null, null, 0::smallint, true);
select _seed_hito('Visita académica (fundación de estudiantes)', 'visita-academica-2026', 'accion_social', 4::smallint, '2026-12-15', '2026-12-15', 'CO', null, null, 0::smallint, true);
select _seed_hito('Membresía CCCE',       'membresia-ccce-2026',  'gremio_gobierno',3::smallint, '2026-10-01', '2026-12-31', 'CO', null, null, 2::smallint);
select _seed_hito('Agencia de PR',        'agencia-pr-2026',      'medios',         1::smallint, '2026-10-01', '2026-12-31', 'CO', null, null, 2::smallint);
select _seed_hito('Black Friday',         'black-friday-2026',    'campana',        1::smallint, '2026-11-27', '2026-11-27', 'CO', null, null, 3::smallint);

drop function _seed_hito(text, text, tipo_hito, smallint, date, date, text, text, text, smallint, boolean);
