-- Tejido · RLS (PRD §5 y §11). Toda la matriz de permisos vive en public.puede().

create or replace function es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(mi_rol() <> 'consulta', false)
$$;

-- Activa RLS en todas las tablas
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Permisos de tabla: la seguridad real la hace RLS
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke update, delete on actividad from authenticated;
revoke insert on actividad from authenticated;

-- Genera select / insert / update / delete para una tabla según el módulo de la matriz
create or replace procedure _politicas(tbl text, modulo text, hito_expr text, solo_actualizar boolean default false)
language plpgsql as $$
begin
  execute format('create policy %I on public.%I for select to authenticated using (puede(%s, %L, %L))',
                 tbl || '_sel', tbl, hito_expr, modulo, 'r');
  execute format('create policy %I on public.%I for update to authenticated using (puede(%s, %L, %L)) with check (puede(%s, %L, %L))',
                 tbl || '_upd', tbl, hito_expr, modulo, 'w', hito_expr, modulo, 'w');
  if not solo_actualizar then
    execute format('create policy %I on public.%I for insert to authenticated with check (puede(%s, %L, %L))',
                   tbl || '_ins', tbl, hito_expr, modulo, 'w');
    execute format('create policy %I on public.%I for delete to authenticated using (puede(%s, %L, %L))',
                   tbl || '_del', tbl, hito_expr, modulo, 'w');
  end if;
end $$;

-- ───── Catálogos: lectura para cualquier usuario activo, escritura solo Admin ─────
do $$
declare t text;
begin
  foreach t in array array['paises','monedas','ejes','movilizadores','etapas','verticales','tipos_hito','configuracion'] loop
    execute format('create policy %I on public.%I for select to authenticated using (mi_rol() is not null)', t || '_sel', t);
    execute format('create policy %I on public.%I for all to authenticated using (es_admin()) with check (es_admin())', t || '_adm', t);
  end loop;
  foreach t in array array['voceros','plantillas_entregables','kpi_metas'] loop
    execute format('create policy %I on public.%I for select to authenticated using (es_staff())', t || '_sel', t);
    execute format('create policy %I on public.%I for all to authenticated using (es_admin()) with check (es_admin())', t || '_adm', t);
  end loop;
end $$;

create policy aliados_sel on aliados for select to authenticated using (es_staff());
create policy aliados_esc on aliados for all to authenticated
  using (mi_rol() in ('admin','lider_impacto')) with check (mi_rol() in ('admin','lider_impacto'));

-- ───── Usuarios ─────
create policy profiles_sel on profiles for select to authenticated
  using (id = auth.uid() or es_staff());
-- sin política de escritura: los cambios de rol pasan por admin_actualizar_usuario()
create policy invitaciones_adm on invitaciones for all to authenticated
  using (es_admin()) with check (es_admin());

-- ───── Hitos ─────
create policy hitos_sel on hitos for select to authenticated using (es_staff());
create policy hitos_upd on hitos for update to authenticated
  using (puede(id, 'ficha', 'w')) with check (puede(id, 'ficha', 'w'));
-- altas por crear_hito(), bajas por eliminar_hito()

create policy hito_paises_sel on hito_paises for select to authenticated using (es_staff());
create policy hito_paises_esc on hito_paises for all to authenticated
  using (puede(hito_id, 'ficha', 'w')) with check (puede(hito_id, 'ficha', 'w'));

create policy hito_asig_sel on hito_asignaciones for select to authenticated using (es_staff());
create policy hito_asig_esc on hito_asignaciones for all to authenticated
  using (puede(hito_id, 'evaluacion', 'w')) with check (puede(hito_id, 'evaluacion', 'w'));

create policy hito_vert_sel on hito_verticales for select to authenticated using (es_staff());
create policy hito_vert_esc on hito_verticales for all to authenticated
  using (puede(hito_id, 'evaluacion', 'w')) with check (puede(hito_id, 'evaluacion', 'w'));

create policy hito_etapas_sel on hito_etapas for select to authenticated using (es_staff());

call _politicas('evaluaciones', 'evaluacion', 'hito_id', true);

-- Entregables: el módulo depende de la etapa de la plantilla
create policy entregables_sel on entregables for select to authenticated
  using (puede(hito_id, modulo_de_etapa((select etapa_id from plantillas_entregables p where p.id = plantilla_id)), 'r'));
create policy entregables_upd on entregables for update to authenticated
  using (puede(hito_id, modulo_de_etapa((select etapa_id from plantillas_entregables p where p.id = plantilla_id)), 'w'))
  with check (puede(hito_id, modulo_de_etapa((select etapa_id from plantillas_entregables p where p.id = plantilla_id)), 'w'));

-- Datos
create policy cifras_sel on cifras for select to authenticated using (mi_rol() in ('admin','lider_eventos','lider_impacto','marcom','datos'));
create policy cifras_esc on cifras for all to authenticated
  using (mi_rol() in ('admin','datos')) with check (mi_rol() in ('admin','datos'));
call _politicas('hito_cifras', 'datos', 'hito_id');

-- Narrativa
call _politicas('narrativas', 'narrativa', 'hito_id', true);
call _politicas('piezas', 'narrativa', 'hito_id');

-- Evento y costos
call _politicas('stands', 'evento', 'hito_id', true);
call _politicas('checklist_items', 'evento', 'hito_id');
call _politicas('costos_items', 'costos_items', 'hito_id');
call _politicas('presupuestos', 'presupuesto', 'hito_id', true);

-- Captura
call _politicas('planes_captura', 'captura', 'hito_id');
create policy canales_sel on canales_captura for select to authenticated
  using (puede((select hito_id from planes_captura p where p.id = plan_id), 'captura', 'r'));
create policy canales_esc on canales_captura for all to authenticated
  using (puede((select hito_id from planes_captura p where p.id = plan_id), 'captura', 'w'))
  with check (puede((select hito_id from planes_captura p where p.id = plan_id), 'captura', 'w'));
call _politicas('resultados_leads', 'resultados', 'hito_id');

-- Social, medios y cierre
call _politicas('acciones_sociales', 'social', 'hito_id');
call _politicas('publicaciones', 'medios', 'hito_id');
call _politicas('cierres', 'cierre', 'hito_id', true);

-- Auditoría (solo lectura: Admin y Datos). Las inserciones las hacen los triggers.
create policy actividad_sel on actividad for select to authenticated using (mi_rol() in ('admin','datos'));

-- Notificaciones propias
create policy notif_sel on notificaciones for select to authenticated using (user_id = auth.uid());
create policy notif_upd on notificaciones for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───── Vista del perfil Consulta: sin costos, sin resultados, sin notas ─────
-- Corre con permisos de su dueño y expone únicamente estas columnas.
create view v_calendario as
select h.id, h.nombre, h.tipo, h.fecha_inicio, h.fecha_fin, h.fecha_por_confirmar,
       (select hp.pais_codigo from hito_paises hp where hp.hito_id = h.id and hp.principal) as pais_codigo,
       array(select hp.pais_codigo::text from hito_paises hp where hp.hito_id = h.id order by hp.principal desc, hp.pais_codigo) as paises,
       h.ciudad, h.venue, e.id as eje_id, e.nombre as eje, e.color as eje_color, h.estado,
       array(select v.nombre from hito_verticales hv join verticales v on v.id = hv.vertical_id
             where hv.hito_id = h.id and hv.rol <> 'no_va' order by v.nombre) as verticales
from hitos h
join ejes e on e.id = h.eje_id
where h.estado <> 'descartado' and mi_rol() is not null;

revoke all on v_calendario from anon;
grant select on v_calendario to authenticated;

-- ───── Ejecución de funciones ─────
revoke execute on all functions in schema public from public, anon;
revoke execute on function
  tareas_programadas(), refrescar_semaforos(uuid), alerta_paises(date),
  notificar_roles(rol_app[], uuid, text, text, text, text),
  notificar_usuario(uuid, uuid, text, text, text, text),
  sincronizar_entregables(uuid), calcular_vence(uuid, smallint)
  from authenticated;

-- ───── Acceso solo por invitación ─────
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───── Archivos privados (planos, renders, actas, fotos) ─────
-- Convención de ruta: {hito_id}/{carpeta}/{archivo}
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('archivos', 'archivos', false) on conflict do nothing;
    execute $p$create policy archivos_sel on storage.objects for select to authenticated using (
      bucket_id = 'archivos' and (
        public.puede(((storage.foldername(name))[1])::uuid, 'evento', 'r')
        or public.puede(((storage.foldername(name))[1])::uuid, 'social', 'r')))$p$;
    execute $p$create policy archivos_ins on storage.objects for insert to authenticated with check (
      bucket_id = 'archivos' and (
        public.puede(((storage.foldername(name))[1])::uuid, 'evento', 'w')
        or public.puede(((storage.foldername(name))[1])::uuid, 'social', 'w')))$p$;
    execute $p$create policy archivos_upd on storage.objects for update to authenticated using (
      bucket_id = 'archivos' and (
        public.puede(((storage.foldername(name))[1])::uuid, 'evento', 'w')
        or public.puede(((storage.foldername(name))[1])::uuid, 'social', 'w')))$p$;
    execute $p$create policy archivos_del on storage.objects for delete to authenticated using (
      bucket_id = 'archivos' and (
        public.puede(((storage.foldername(name))[1])::uuid, 'evento', 'w')
        or public.puede(((storage.foldername(name))[1])::uuid, 'social', 'w')))$p$;
  end if;
end $$;

drop procedure _politicas(text, text, text, boolean);
