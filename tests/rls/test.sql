-- Pruebas de RLS, compuertas y reglas del PRD. Cada DO es una transacción; falla si algo no se cumple.

create or replace function _as(e text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', (select id::text from profiles where email = e), true);
  perform set_config('role', 'authenticated', true);
end $$;

-- Ejecuta una sentencia y devuelve el mensaje de error (o null si no falló)
create or replace function _falla(q text) returns text language plpgsql as $$
begin execute q; return null; exception when others then return sqlerrm; end $$;

create or replace function _faltantes(p uuid) returns text language sql as $$
  select array_to_string(faltantes_compuerta(p), ' | ')
$$;

grant execute on function _as(text), _falla(text), _faltantes(uuid) to public;

-- ───────── 0. Invitaciones y usuarios ─────────
do $$
declare n int; ok boolean := false;
begin
  insert into invitaciones (email, rol, nombre) values
    ('ceo@t.co','admin','CEO'), ('head@t.co','admin','Head'), ('jaqui@t.co','lider_eventos','Jaqui'),
    ('adriana@t.co','doer_eventos','Adriana'), ('sandra@t.co','lider_impacto','Sandra'),
    ('harold@t.co','marcom','Harold'), ('ricky@t.co','datos','Ricky'), ('vert@t.co','consulta','Líder de vertical');
  insert into auth.users (email) select email from invitaciones;
  select count(*) into n from profiles;
  assert n = 8, 'deben crearse 8 perfiles, hay ' || n;

  begin
    insert into auth.users (email) values ('intruso@x.co');
  exception when sqlstate 'P0001' then ok := true; end;
  assert ok, 'un correo no invitado NO debe poder registrarse';
  raise notice 'ok - acceso solo por invitación';

  select count(*) into n from paises; assert n = 22, '22 países, hay ' || n;
  select count(*) into n from hitos; assert n = 13, '13 hitos semilla, hay ' || n;
  select count(*) into n from hito_etapas where estado = 'omitida'
    and hito_id = (select id from hitos where slug = 'revista-semana-2026');
  assert n = 2, 'Revista Semana salta Preparación y Ejecución';
  select etapa_id into n from hitos where slug = 'despega-2026'; assert n = 6;
  raise notice 'ok - semilla: 22 países, 13 hitos, etapas iniciales';
end $$;

-- ───────── 1. Consulta: solo calendario, sin costos, resultados ni notas ─────────
do $$
declare n int; cols text;
begin
  insert into costos_items (hito_id, concepto, valor) select id, 'Stand', 1000000 from hitos where slug = 'despega-2026';
  update presupuestos set presupuesto_total = 5000000, costo_real = 4000000 where hito_id = (select id from hitos where slug = 'despega-2026');
  perform _as('vert@t.co');
  select count(*) into n from hitos; assert n = 0, 'Consulta no lee la tabla hitos';
  select count(*) into n from v_calendario; assert n = 13, 'Consulta ve el calendario (13), ve ' || n;
  select count(*) into n from presupuestos; assert n = 0, 'Consulta no ve presupuestos';
  select count(*) into n from costos_items; assert n = 0, 'Consulta no ve costos';
  select count(*) into n from resultados_leads; assert n = 0, 'Consulta no ve resultados';
  select count(*) into n from actividad; assert n = 0, 'Consulta no ve auditoría';
  select count(*) into n from narrativas; assert n = 0, 'Consulta no ve notas internas';
  reset role;
  select string_agg(column_name, ',') into cols from information_schema.columns where table_name = 'v_calendario';
  assert cols !~* 'costo|presupuesto|resultado|nota|lead', 'la vista no expone costos: ' || cols;
  raise notice 'ok - Consulta solo ve v_calendario (%)', cols;
end $$;

-- ───────── 2. Doer: costos de sus hitos, nunca el presupuesto ─────────
do $$
declare n int; d uuid; o uuid;
begin
  select id into d from hitos where slug = 'despega-2026';
  select id into o from hitos where slug = 'labs-summit-2026';
  insert into costos_items (hito_id, concepto, valor) values (o, 'Montaje', 500);
  insert into hito_asignaciones (hito_id, user_id) select d, id from profiles where email = 'adriana@t.co';
  perform _as('adriana@t.co');
  select count(*) into n from costos_items; assert n = 1, 'Adriana ve solo los costos de su hito, ve ' || n;
  select count(*) into n from presupuestos; assert n = 0, 'Adriana no ve presupuesto total ni costo real';
  select count(*) into n from hitos; assert n = 13, 'Adriana ve el calendario';
  select count(*) into n from narrativas; assert n = 0;
  select count(*) into n from cifras; assert n = 0;
  assert _falla(format('insert into costos_items (hito_id, concepto) values (%L, %L)', o, 'x')) is not null,
    'Adriana no puede escribir costos de un hito ajeno';
  assert _falla(format('insert into costos_items (hito_id, concepto, valor) values (%L, %L, 1)', d, 'Flete')) is null,
    'Adriana sí escribe costos en su hito';
  reset role;
  raise notice 'ok - doer: costos solo de sus hitos, sin presupuesto';
end $$;

-- ───────── 3. Ciclo completo con compuertas ─────────
do $$
declare
  h uuid; r jsonb; n int; roax int; plan uuid; f text;
begin
  perform _as('head@t.co');
  h := crear_hito(jsonb_build_object(
    'nombre','Expo Prueba','tipo','evento_externo','eje_id',1,'paises',jsonb_build_array('MX','CO'),
    'fecha_inicio', current_date + 20, 'fecha_fin', current_date + 21, 'ciudad','CDMX','venue','Centro',
    'organizador','Org','url','https://x.co','asistentes_estimados',100000,'costo_estimado',9000000));
  select count(*) into n from hito_etapas where hito_id = h; assert n = 8;
  select count(*) into n from hito_paises where hito_id = h and principal and pais_codigo = 'MX'; assert n = 1, 'primer país es el principal';
  reset role;

  -- Radar → Evaluación
  perform _as('head@t.co');
  r := avanzar_etapa(h); assert (r->>'ok')::boolean, 'Radar completo avanza: ' || r::text;

  -- Evaluación: 6 criterios, ≥ 18, matriz de verticales con rol confirmado
  r := avanzar_etapa(h); assert not (r->>'ok')::boolean;
  assert r->>'faltantes' like '%6 criterios%', 'pide los 6 criterios';
  update evaluaciones set audiencia = 3, mercado = 3, mensaje = 3, rol_posible = 3, costo_resultado = 3, competencia = 2 where hito_id = h;
  r := avanzar_etapa(h);
  assert r->>'faltantes' like '%mínimo es 18%', 'puntaje 17 no pasa: ' || r::text;
  update evaluaciones set competencia = 3 where hito_id = h;
  select id into roax from verticales where slug = 'roax';
  insert into hito_verticales (hito_id, vertical_id, pertinencia, importancia, audiencia_objetivo, meta_leads)
    values (h, roax, 5, 4, 2000, 150);
  select rol::text into f from hito_verticales where hito_id = h and vertical_id = roax;
  assert f = 'protagonista', 'pertinencia 5 + importancia 4 = 9 → protagonista, es ' || f;
  r := avanzar_etapa(h);
  assert r->>'faltantes' like '%debe confirmar el rol%', 'el líder confirma el rol: ' || r::text;
  reset role;
  perform _as('jaqui@t.co');
  update hito_verticales set rol_confirmado = true where hito_id = h and vertical_id = roax;
  reset role;
  perform _as('head@t.co');
  r := avanzar_etapa(h); assert (r->>'ok')::boolean, 'Evaluación aprobada: ' || r::text;
  select puntaje_evaluacion into n from hitos where id = h; assert n = 18;
  reset role;

  -- Datos: sin cifra validada no hay narrativa
  perform _as('harold@t.co');
  assert _falla(format('select avanzar_etapa(%L)', h)) like '%no aprueba%', 'Marketing no aprueba Datos';
  reset role;
  perform _as('ricky@t.co');
  r := avanzar_etapa(h);
  assert not (r->>'ok')::boolean and r->>'faltantes' like '%Falta 1 cifra validada para el eje E-commerce%',
    'bloqueo de Narrativa sin dato: ' || r::text;
  insert into cifras (eje_id, enunciado, valor, unidad, fuente, fecha_corte, vigente_hasta, estado)
    values (1, '80% del e-commerce es contraentrega', 80, '%', 'Informe', current_date, current_date + 90, 'validada');
  insert into hito_cifras select h, id from cifras;
  update entregables set completo = true where hito_id = h;
  r := avanzar_etapa(h); assert (r->>'ok')::boolean, 'Datos aprobado: ' || r::text;
  reset role;

  -- Narrativa: la aprueba el Head, Marketing no puede marcarla aprobada
  perform _as('harold@t.co');
  assert _falla(format('select avanzar_etapa(%L)', h)) like '%no aprueba%', 'Marketing no aprueba su propia narrativa';
  update narrativas set mensaje_clave = 'Dropi es el dato', vocero_id = null, audiencia = 'Founders', momento = 'Charla', plan_medios = 'Prensa' where hito_id = h;
  assert _falla(format('update narrativas set aprobada = true where hito_id = %L', h)) like '%Head%', 'no se auto-aprueba';
  reset role;
  insert into voceros (nombre, cargo) values ('Vocero Uno','CEO');
  perform _as('head@t.co');
  r := avanzar_etapa(h); assert not (r->>'ok')::boolean, 'falta vocero y piezas';
  reset role;
  perform _as('harold@t.co');
  update narrativas set vocero_id = (select id from voceros limit 1) where hito_id = h;
  insert into piezas (hito_id, tipo, titulo) values (h, 'one_pager', 'One-pager');
  reset role;
  perform _as('head@t.co');
  r := avanzar_etapa(h); assert (r->>'ok')::boolean, 'Narrativa aprobada: ' || r::text;
  select aprobada into strict f from narrativas where hito_id = h; assert f::boolean;
  reset role;

  -- Preparación: stand, checklist crítico, presupuesto y plan de captura aprobado por vertical
  perform _as('jaqui@t.co');
  f := _faltantes(h);
  assert f like '%medidas del stand%' and f like '%plan de captura aprobado de ROAX%', 'Preparación pide: ' || f;
  update stands set ancho_m = 6, fondo_m = 4, tipo = 'isla' where hito_id = h;
  select m2::int into n from stands where hito_id = h; assert n = 24, 'm² = ancho × fondo';
  update presupuestos set presupuesto_total = 9500000 where hito_id = h;
  insert into checklist_items (hito_id, concepto, critico, completo) values (h, 'Montaje', true, false);
  insert into planes_captura (hito_id, vertical_id, metodo, destino_crm, meta) values (h, roax, 'QR + tablet', 'Formulario Eventos ROAX', 150)
    returning id into plan;
  assert _falla(format('update planes_captura set aprobado = true where id = %L', plan)) like '%administrador%',
    'el líder de eventos no aprueba el plan de captura';
  reset role;
  perform _as('head@t.co');
  update planes_captura set aprobado = true where id = plan;
  reset role;
  perform _as('jaqui@t.co');
  f := _faltantes(h);
  assert f like '%Checklist crítico pendiente: Montaje%' and f not like '%plan de captura%', 'solo falta el checklist: ' || f;
  update checklist_items set completo = true where hito_id = h;
  r := avanzar_etapa(h); assert (r->>'ok')::boolean, 'Preparación aprobada: ' || r::text;
  reset role;

  -- Ejecución: el cliente no puede saltarse la compuerta
  perform _as('jaqui@t.co');
  assert _falla(format('update hitos set etapa_id = 7 where id = %L', h)) like '%avanzar_etapa%', 'no se puede mover la etapa desde el cliente';
  assert _falla(format('select avanzar_etapa(%L, null, true, %L)', h, 'prisa')) like '%administrador%', 'solo Admin fuerza';
  reset role;
  perform _as('head@t.co');
  assert _falla(format('select avanzar_etapa(%L, null, true, null)', h)) like '%motivo%', 'forzar exige motivo';
  r := avanzar_etapa(h, null, true, 'El organizador cambió la fecha');
  assert (r->>'ok')::boolean, 'forzar con motivo';
  reset role;
  select count(*) into n from actividad where hito_id = h and accion = 'etapa.forzada' and motivo = 'El organizador cambió la fecha';
  assert n = 1, 'el forzado queda en el log con motivo';
  select etapa_id into n from hitos where id = h; assert n = 6, 'después de Ejecución viene Amplificación, está en ' || n;
  raise notice 'ok - ciclo: Radar → Evaluación → Datos → Narrativa → Preparación → Ejecución (forzada) → Amplificación';

  -- Semáforo: compuerta vencida → ámbar; rojo si faltan < 7 días
  perform refrescar_semaforos(null);
  select semaforo::text into f from hitos where id = h;
  raise notice 'semáforo del hito de prueba: %', f;
end $$;

-- ───────── 4. Semáforo ámbar / rojo ─────────
do $$
declare a uuid; b uuid; s text;
begin
  perform _as('head@t.co');
  a := crear_hito(jsonb_build_object('nombre','Cerca','tipo','medios','eje_id',1,'paises',jsonb_build_array('CO'),
        'fecha_inicio', current_date + 3, 'fecha_fin', current_date + 3));
  b := crear_hito(jsonb_build_object('nombre','Lejos','tipo','medios','eje_id',1,'paises',jsonb_build_array('CO'),
        'fecha_inicio', current_date + 60, 'fecha_fin', current_date + 60));
  reset role;
  -- A: Radar abierto y sin plazo; la evaluación vence 30 días antes → forzar a Evaluación abierta vencida
  perform set_config('tejido.interno','on',true);
  update hito_etapas set estado = 'aprobada' where hito_id in (a, b) and etapa_id = 0;
  update hito_etapas set estado = 'abierta' where hito_id in (a, b) and etapa_id = 1;
  update hitos set etapa_id = 1 where id in (a, b);
  perform set_config('tejido.interno','off',true);
  perform refrescar_semaforos(null);
  select semaforo::text into s from hitos where id = a; assert s = 'rojo', 'vencida y faltan < 7 días → rojo, es ' || s;
  select semaforo::text into s from hitos where id = b; assert s = 'verde', 'a 60 días la evaluación aún no vence → verde, es ' || s;
  update hito_etapas set vence_en = now() - interval '1 day' where hito_id = b and etapa_id = 1;
  perform refrescar_semaforos(b);
  select semaforo::text into s from hitos where id = b; assert s = 'ambar', 'vencida con tiempo → ámbar, es ' || s;
  assert exists (select 1 from notificaciones where hito_id = b and tipo = 'compuerta_vencida'), 'notifica compuerta vencida';
  raise notice 'ok - semáforo verde / ámbar / rojo y aviso de compuerta vencida';
end $$;

-- ───────── 5. Amplificación y cierre del evento semilla ─────────
do $$
declare d uuid; r jsonb; f text;
begin
  select id into d from hitos where slug = 'despega-2026';
  perform _as('harold@t.co');
  r := avanzar_etapa(d);
  assert not (r->>'ok')::boolean and r->>'faltantes' like '%publicación%', 'sin publicación no hay compuerta de Medios';
  insert into publicaciones (hito_id, medio, tipo, url, fecha) values (d, 'LinkedIn', 'propio', 'https://l.co/x', now());
  r := avanzar_etapa(d); assert (r->>'ok')::boolean, 'Amplificación aprobada: ' || r::text;
  reset role;
  perform _as('ricky@t.co');
  f := _faltantes(d);
  assert f like '%asistencia real%' and f like '%3 aprendizajes%', 'Cierre pide asistencia, costo y aprendizajes: ' || f;
  reset role;
  raise notice 'ok - Amplificación → Cierre';
end $$;

-- ───────── 6. Auditoría inmutable y visibilidad ─────────
do $$
declare n int;
begin
  assert _falla('update actividad set accion = ''x''') like '%solo inserción%', 'el log no se edita';
  assert _falla('delete from actividad') like '%solo inserción%', 'el log no se borra';
  perform _as('harold@t.co'); select count(*) into n from actividad; reset role;
  assert n = 0, 'Marketing no lee el log';
  perform _as('ricky@t.co'); select count(*) into n from actividad; reset role;
  assert n > 0, 'Datos lee el log';
  perform _as('head@t.co');
  assert _falla('select admin_actualizar_usuario((select id from profiles where email=''harold@t.co''), ''admin'', true, null)') like '%motivo%';
  perform admin_actualizar_usuario((select id from profiles where email='harold@t.co'), 'marcom', false, 'Licencia');
  reset role;
  assert exists (select 1 from actividad where entidad = 'profiles' and motivo = 'Licencia'), 'cambio de usuario auditado';
  perform _as('harold@t.co'); select count(*) into n from hitos; reset role;
  assert n = 0, 'usuario inactivo pierde el acceso';
  update profiles set activo = true where email = 'harold@t.co';
  raise notice 'ok - auditoría inmutable, roles y desactivación';
end $$;

-- ───────── 7. Alertas de país, duplicar, borrar ─────────
do $$
declare n int; d uuid;
begin
  assert alerta_paises(date '2026-10-01') = 0, 'a más de 30 días del cierre no alerta';
  n := alerta_paises(date '2026-12-10');
  assert n >= 8, 'a < 30 días alerta países alta/media sin hitos (hay ' || n || ')';
  assert not exists (select 1 from notificaciones where tipo = 'pais_sin_presencia' and titulo like 'Colombia%'),
    'Colombia tiene hitos: sin alerta';
  assert not exists (select 1 from notificaciones where tipo = 'pais_sin_presencia' and titulo like 'Rumanía%'),
    'Rumanía es prioridad baja: sin alerta';

  perform _as('jaqui@t.co');
  d := duplicar_hito((select id from hitos where slug = 'labs-summit-2026'), date '2027-10-28', date '2027-10-30');
  reset role;
  assert (select etapa_id from hitos where id = d) = 0, 'el duplicado arranca en Radar';
  assert (select count(*) from hito_paises where hito_id = d) = 1;

  perform _as('jaqui@t.co');
  assert _falla(format('select eliminar_hito(%L, %L)', d, 'x')) like '%administrador%', 'solo Admin borra';
  reset role;
  perform _as('ceo@t.co');
  perform eliminar_hito(d, 'Duplicado por error');
  reset role;
  assert exists (select 1 from actividad where accion = 'hitos.delete' and motivo = 'Duplicado por error'), 'borrado auditado con motivo';
  raise notice 'ok - alertas de país, duplicar y borrar con motivo';
end $$;

select 'TODAS LAS PRUEBAS PASARON' as resultado;
