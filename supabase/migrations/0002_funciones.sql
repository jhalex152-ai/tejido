-- Tejido · funciones de negocio, compuertas, triggers y alertas

-- ───────────── Utilidades ─────────────
create or replace function slugify(t text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(t,''),'áéíóúüñÁÉÍÓÚÜÑ','aeiouunAEIOUUN')),
    '[^a-z0-9]+','-','g'))
$$;

create or replace function interno() returns boolean
language sql stable as $$ select coalesce(current_setting('tejido.interno', true),'') = 'on' $$;

-- ───────────── Roles y alcance ─────────────
create or replace function mi_rol() returns rol_app
language sql stable security definer set search_path = public as $$
  select rol from profiles where id = auth.uid() and activo
$$;

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(mi_rol() = 'admin', false)
$$;

create or replace function en_alcance(p_hito uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from hitos h
    where h.id = p_hito and (
      h.responsable_id = auth.uid() or h.creado_por = auth.uid()
      or exists (select 1 from hito_asignaciones a where a.hito_id = h.id and a.user_id = auth.uid())
      or (mi_rol() = 'lider_impacto' and h.eje_id = 4)
    )
  )
$$;

-- Matriz de permisos del PRD §5 en un solo lugar. p_accion: 'r' lectura, 'w' escritura.
create or replace function puede(p_hito uuid, p_modulo text, p_accion text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v rol_app := mi_rol();
  rd rol_app[]; wr rol_app[];
  con_alcance boolean := false;
begin
  if v is null or v = 'consulta' then return false; end if;
  if v = 'admin' then return true; end if;

  case p_modulo
    when 'ficha' then
      rd := '{lider_eventos,doer_eventos,lider_impacto,marcom,datos}'; wr := '{lider_eventos,lider_impacto,marcom}';
    when 'evaluacion' then
      rd := '{lider_eventos,lider_impacto,marcom,datos}'; wr := '{lider_eventos,lider_impacto}';
    when 'datos' then
      rd := '{lider_eventos,lider_impacto,marcom,datos}'; wr := '{datos}';
    when 'narrativa' then
      rd := '{lider_eventos,lider_impacto,marcom,datos}'; wr := '{marcom}';
    when 'evento' then
      rd := '{lider_eventos,doer_eventos,lider_impacto,marcom}'; wr := '{lider_eventos,doer_eventos,lider_impacto}';
    when 'costos_items' then
      rd := '{lider_eventos,doer_eventos,lider_impacto,datos}'; wr := '{lider_eventos,doer_eventos,lider_impacto}';
    when 'presupuesto' then
      rd := '{lider_eventos,lider_impacto,datos}'; wr := '{lider_eventos,lider_impacto}';
    when 'social' then
      rd := '{lider_eventos,lider_impacto,marcom,datos}'; wr := '{lider_impacto}';
    when 'medios' then
      rd := '{lider_eventos,lider_impacto,marcom,datos}'; wr := '{marcom}';
    when 'captura' then
      rd := '{lider_eventos,doer_eventos,lider_impacto,marcom,datos}'; wr := '{lider_eventos,lider_impacto}';
    when 'resultados' then
      rd := '{lider_eventos,lider_impacto,marcom,datos}'; wr := '{datos}';
    when 'cierre' then
      rd := '{lider_eventos,lider_impacto,marcom,datos}'; wr := '{datos}';
    else return false;
  end case;

  if p_accion = 'r' then
    if not (v = any(rd)) then return false; end if;
  else
    if not (v = any(wr)) then return false; end if;
  end if;

  -- (P) solo en hitos asignados o de su eje
  if v = 'doer_eventos' then con_alcance := true;
  elsif v = 'lider_impacto' and (
          p_modulo in ('evaluacion','evento','costos_items','presupuesto','captura','resultados','social')
          or (p_modulo = 'ficha' and p_accion = 'w')) then con_alcance := true;
  elsif v = 'marcom' and p_modulo = 'ficha' and p_accion = 'w' then con_alcance := true;
  end if;

  if con_alcance then return en_alcance(p_hito); end if;
  return true;
end $$;

create or replace function modulo_de_etapa(p_etapa smallint) returns text
language sql immutable as $$
  select case p_etapa when 0 then 'ficha' when 1 then 'evaluacion' when 2 then 'datos'
    when 3 then 'narrativa' when 4 then 'evento' when 5 then 'evento' when 6 then 'medios'
    when 7 then 'cierre' end
$$;

-- ───────────── Auditoría ─────────────
create or replace function audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_row jsonb := coalesce(v_new, v_old);
  v_hito uuid; v_acc text; v_motivo text;
begin
  if tg_op = 'UPDATE' then
    if tg_table_name = 'hitos' and (v_old - 'semaforo' - 'puntaje_evaluacion') = (v_new - 'semaforo' - 'puntaje_evaluacion') then return new; end if;
    if tg_table_name = 'hito_etapas' and v_old->>'estado' = v_new->>'estado' then return new; end if;
    if v_old = v_new then return new; end if;
  end if;

  v_hito := case when tg_table_name = 'hitos' then (v_row->>'id')::uuid else nullif(v_row->>'hito_id','')::uuid end;
  v_acc := tg_table_name || '.' || lower(tg_op);
  v_motivo := coalesce(nullif(current_setting('tejido.motivo', true), ''), v_row->>'motivo', v_row->>'motivo_estado');

  if tg_table_name = 'hito_etapas' then
    v_acc := case when (v_new->>'forzada')::boolean then 'etapa.forzada' else 'etapa.' || (v_new->>'estado') end;
  elsif tg_table_name = 'profiles' and tg_op = 'UPDATE' and v_old->>'rol' <> v_new->>'rol' then
    v_acc := 'usuario.cambio_rol';
  end if;

  insert into actividad (user_id, entidad, entidad_id, hito_id, accion, antes, despues, motivo)
  values (auth.uid(), tg_table_name,
          coalesce(v_row->>'id', v_row->>'hito_id', v_row->>'email'),
          v_hito, v_acc, v_old, v_new, v_motivo);
  return coalesce(new, old);
end $$;

create or replace function actividad_inmutable() returns trigger
language plpgsql as $$ begin raise exception 'El log de auditoría es de solo inserción'; end $$;

create trigger actividad_no_update before update or delete on actividad
  for each row execute function actividad_inmutable();

create trigger aud_hitos after insert or update or delete on hitos for each row execute function audit_row();
create trigger aud_hito_etapas after update on hito_etapas for each row execute function audit_row();
create trigger aud_profiles after update or delete on profiles for each row execute function audit_row();
create trigger aud_invitaciones after insert or delete on invitaciones for each row execute function audit_row();
create trigger aud_planes after insert or update or delete on planes_captura for each row execute function audit_row();
create trigger aud_resultados after insert or update or delete on resultados_leads for each row execute function audit_row();
create trigger aud_publicaciones after insert or delete on publicaciones for each row execute function audit_row();
create trigger aud_presupuestos after update or delete on presupuestos for each row execute function audit_row();
create trigger aud_costos after delete on costos_items for each row execute function audit_row();
create trigger aud_cifras after update or delete on cifras for each row execute function audit_row();

-- ───────────── Acceso solo por invitación ─────────────
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv invitaciones;
begin
  select * into inv from invitaciones where email = lower(new.email);
  if not found then
    raise exception 'Correo no invitado: %', new.email using errcode = 'P0001';
  end if;
  insert into profiles (id, nombre, email, rol)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name',''), inv.nombre, split_part(new.email,'@',1)),
          lower(new.email), inv.rol);
  update invitaciones set aceptada_en = now() where email = inv.email;
  return new;
end $$;

-- ───────────── Notificaciones ─────────────
create or replace function notificar_roles(
  p_roles rol_app[], p_hito uuid, p_tipo text, p_titulo text, p_detalle text, p_clave text
) returns void language sql security definer set search_path = public as $$
  insert into notificaciones (user_id, tipo, hito_id, titulo, detalle, clave_unica)
  select id, p_tipo, p_hito, p_titulo, p_detalle, p_clave
  from profiles where activo and rol = any(p_roles)
  on conflict (user_id, clave_unica) where clave_unica is not null do nothing
$$;

create or replace function notificar_usuario(
  p_user uuid, p_hito uuid, p_tipo text, p_titulo text, p_detalle text, p_clave text
) returns void language sql security definer set search_path = public as $$
  insert into notificaciones (user_id, tipo, hito_id, titulo, detalle, clave_unica)
  values (p_user, p_tipo, p_hito, p_titulo, p_detalle, p_clave)
  on conflict (user_id, clave_unica) where clave_unica is not null do nothing
$$;

-- ───────────── Etapas del hito ─────────────
create or replace function calcular_vence(p_hito uuid, p_etapa smallint) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when e.plazo_dias is null then null
    else (((case e.plazo_ref when 'inicio' then h.fecha_inicio else h.fecha_fin end) + e.plazo_dias)::timestamp
           at time zone 'America/Bogota')
    + case when e.id = 6 then interval '1 day' else interval '0' end   -- fin del día de término + 48 h
    + case when e.id in (5) then interval '1 day' else interval '0' end
  end
  from hitos h, etapas e where h.id = p_hito and e.id = p_etapa
$$;

create or replace function sincronizar_entregables(p_hito uuid) returns void
language sql security definer set search_path = public as $$
  insert into entregables (hito_id, plantilla_id)
  select p_hito, p.id from plantillas_entregables p, hitos h
  where h.id = p_hito and (p.tipo_hito is null or p.tipo_hito = h.tipo)
  on conflict (hito_id, plantilla_id) do nothing
$$;

create or replace function hito_inicializar() returns trigger
language plpgsql security definer set search_path = public as $$
declare t tipos_hito;
begin
  select * into t from tipos_hito where tipo = new.tipo;
  insert into hito_etapas (hito_id, etapa_id, estado, abierta_en, vence_en)
  select new.id, e.id,
         case when e.id = any(t.etapas_omitidas) then 'omitida'::estado_etapa
              when e.id = 0 then 'abierta'::estado_etapa else 'pendiente'::estado_etapa end,
         case when e.id = 0 then now() end,
         case when e.id = any(t.etapas_omitidas) then null else calcular_vence(new.id, e.id) end
  from etapas e;
  insert into evaluaciones (hito_id) values (new.id);
  insert into narrativas (hito_id) values (new.id);
  insert into presupuestos (hito_id) values (new.id);
  insert into cierres (hito_id) values (new.id);
  if t.es_evento then insert into stands (hito_id) values (new.id); end if;
  perform sincronizar_entregables(new.id);
  return new;
end $$;
create trigger hito_init after insert on hitos for each row execute function hito_inicializar();

create or replace function hito_fechas_cambian() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.fecha_inicio <> old.fecha_inicio or new.fecha_fin <> old.fecha_fin then
    update hito_etapas he set vence_en = calcular_vence(new.id, he.etapa_id)
    where he.hito_id = new.id and he.estado in ('pendiente','abierta');
  end if;
  return new;
end $$;
create trigger hito_fechas after update on hitos for each row execute function hito_fechas_cambian();

-- El cliente no puede mover etapa, cerrar ni tocar el semáforo: solo las funciones internas
create or replace function hito_proteger() returns trigger
language plpgsql as $$
begin
  if not interno() and auth.uid() is not null then
    if new.etapa_id <> old.etapa_id or new.semaforo <> old.semaforo
       or new.puntaje_evaluacion is distinct from old.puntaje_evaluacion
       or (new.estado <> old.estado and (new.estado = 'cerrado' or old.estado = 'cerrado')) then
      raise exception 'La etapa y el cierre solo cambian con avanzar_etapa()';
    end if;
  end if;
  return new;
end $$;
create trigger hito_proteger before update on hitos for each row execute function hito_proteger();

create or replace function narrativa_proteger() returns trigger
language plpgsql as $$
begin
  if not interno() and auth.uid() is not null and not es_admin() and new.aprobada and not old.aprobada then
    raise exception 'La narrativa solo la aprueba el Head desde la compuerta';
  end if;
  return new;
end $$;
create trigger narrativa_proteger before update on narrativas for each row execute function narrativa_proteger();

create or replace function plan_proteger() returns trigger
language plpgsql as $$
begin
  if not interno() and auth.uid() is not null and not es_admin()
     and new.aprobado and (tg_op = 'INSERT' or not old.aprobado) then
    raise exception 'El plan de captura solo lo aprueba un administrador';
  end if;
  return new;
end $$;
create trigger plan_proteger before insert or update on planes_captura for each row execute function plan_proteger();

-- Puntaje de evaluación → hitos
create or replace function evaluacion_total() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('tejido.interno','on',true);
  update hitos set puntaje_evaluacion = case
      when new.audiencia is not null and new.mercado is not null and new.mensaje is not null
       and new.rol_posible is not null and new.costo_resultado is not null and new.competencia is not null
      then new.total end
  where id = new.hito_id;
  perform set_config('tejido.interno','off',true);
  return new;
end $$;
create trigger evaluacion_total after insert or update on evaluaciones for each row execute function evaluacion_total();

-- Rol sugerido de la vertical: ≥ 8 protagonista, 5–7 presente, ≤ 4 no va (el líder lo confirma)
create or replace function vertical_rol_sugerido() returns trigger
language plpgsql as $$
begin
  if not new.rol_confirmado then
    new.rol := case when new.pertinencia + new.importancia >= 8 then 'protagonista'
                    when new.pertinencia + new.importancia >= 5 then 'presente'
                    else 'no_va' end;
  end if;
  return new;
end $$;
create trigger vertical_rol before insert or update on hito_verticales for each row execute function vertical_rol_sugerido();

create or replace function cifra_validar() returns trigger
language plpgsql as $$
begin
  if new.estado = 'validada' and (tg_op = 'INSERT' or old.estado <> 'validada') then
    new.validada_por := auth.uid(); new.validada_en := now();
  end if;
  return new;
end $$;
create trigger cifra_validar before insert or update on cifras for each row execute function cifra_validar();

create or replace function asignacion_notificar() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nombre text;
begin
  select nombre into v_nombre from hitos where id = new.hito_id;
  perform notificar_usuario(new.user_id, new.hito_id, 'tarea_asignada',
     'Te asignaron: ' || v_nombre, 'Función: ' || new.funcion, 'asig-' || new.hito_id || '-' || new.user_id);
  return new;
end $$;
create trigger asignacion_notificar after insert on hito_asignaciones for each row execute function asignacion_notificar();

-- ───────────── Compuertas ─────────────
-- Devuelve lo que falta para aprobar la compuerta de la etapa actual del hito.
create or replace function faltantes_compuerta(p_hito uuid) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare
  h hitos; t tipos_hito; f text[] := '{}'; r record; ev evaluaciones; np narrativas; st stands;
  pres presupuestos; fin_evento timestamptz;
begin
  if auth.uid() is not null and coalesce(mi_rol(),'consulta') = 'consulta' then return '{}'; end if;
  select * into h from hitos where id = p_hito;
  if not found then return array['El hito no existe']; end if;
  select * into t from tipos_hito where tipo = h.tipo;
  select * into pres from presupuestos where hito_id = p_hito;

  if h.etapa_id = 0 then
    if not exists (select 1 from hito_paises where hito_id = p_hito and principal) then f := f || 'Falta el país principal'::text; end if;
    if t.es_evento then
      if coalesce(trim(h.ciudad),'') = '' then f := f || 'Falta la ciudad'::text; end if;
      if coalesce(trim(h.venue),'') = '' then f := f || 'Falta el venue'::text; end if;
      if coalesce(trim(h.organizador),'') = '' then f := f || 'Falta el organizador'::text; end if;
      if h.asistentes_estimados is null then f := f || 'Faltan los asistentes estimados'::text; end if;
      if pres.costo_estimado is null then f := f || 'Falta el costo estimado'::text; end if;
      if h.tipo = 'evento_externo' and coalesce(trim(h.url),'') = '' then f := f || 'Falta el link del evento'::text; end if;
    end if;

  elsif h.etapa_id = 1 then
    select * into ev from evaluaciones where hito_id = p_hito;
    if ev.audiencia is null or ev.mercado is null or ev.mensaje is null
       or ev.rol_posible is null or ev.costo_resultado is null or ev.competencia is null then
      f := f || 'Faltan puntajes en los 6 criterios de evaluación'::text;
    elsif ev.total < 18 then
      f := f || format('El puntaje es %s/30 y el mínimo es 18', ev.total);
    end if;
    if t.usa_captura then
      if not exists (select 1 from hito_verticales where hito_id = p_hito and rol <> 'no_va') then
        f := f || 'Ninguna vertical está marcada como Protagonista o Presente'::text;
      end if;
      for r in select v.nombre, hv.* from hito_verticales hv join verticales v on v.id = hv.vertical_id
               where hv.hito_id = p_hito and hv.rol <> 'no_va' loop
        if r.audiencia_objetivo is null or r.meta_leads is null then
          f := f || format('%s: falta audiencia objetivo o meta de leads', r.nombre);
        end if;
        if not r.rol_confirmado then
          f := f || format('%s: el líder de eventos debe confirmar el rol', r.nombre);
        end if;
      end loop;
    end if;

  elsif h.etapa_id = 2 then
    for r in select e.id, e.nombre from ejes e where e.id = h.eje_id or e.id = any(h.ejes_secundarios) loop
      if not exists (
        select 1 from hito_cifras hc join cifras c on c.id = hc.cifra_id
        where hc.hito_id = p_hito and c.eje_id = r.id and c.estado = 'validada'
          and (c.vigente_hasta is null or c.vigente_hasta >= current_date)
      ) then f := f || format('Falta 1 cifra validada para el eje %s', r.nombre); end if;
    end loop;

  elsif h.etapa_id = 3 then
    select * into np from narrativas where hito_id = p_hito;
    if coalesce(trim(np.mensaje_clave),'') = '' then f := f || 'Falta el mensaje clave'::text; end if;
    if np.vocero_id is null then f := f || 'Falta el vocero'::text; end if;
    if coalesce(trim(np.audiencia),'') = '' then f := f || 'Falta la audiencia'::text; end if;
    if coalesce(trim(np.momento),'') = '' then f := f || 'Falta el momento de la vocería'::text; end if;
    if coalesce(trim(np.plan_medios),'') = '' then f := f || 'Falta el plan de medios previsto'::text; end if;
    if not exists (select 1 from piezas where hito_id = p_hito) then f := f || 'Falta al menos una pieza (charla, one-pager, post o nota)'::text; end if;

  elsif h.etapa_id = 4 then
    if t.es_evento then
      select * into st from stands where hito_id = p_hito;
      if st.ancho_m is null or st.fondo_m is null then f := f || 'Faltan las medidas del stand (ancho × fondo)'::text; end if;
      if coalesce(trim(st.tipo),'') = '' then f := f || 'Falta el tipo de stand'::text; end if;
      if pres.presupuesto_total is null then f := f || 'Falta el presupuesto total'::text; end if;
    end if;
    if not exists (select 1 from checklist_items where hito_id = p_hito) and t.es_evento then
      f := f || 'El checklist operativo está vacío'::text;
    end if;
    for r in select concepto from checklist_items where hito_id = p_hito and critico and not completo loop
      f := f || format('Checklist crítico pendiente: %s', r.concepto);
    end loop;
    if t.usa_captura then
      for r in select v.nombre from hito_verticales hv join verticales v on v.id = hv.vertical_id
               where hv.hito_id = p_hito and hv.rol <> 'no_va'
                 and not exists (select 1 from planes_captura pc
                                 where pc.hito_id = p_hito and pc.vertical_id = hv.vertical_id and pc.aprobado) loop
        f := f || format('Falta el plan de captura aprobado de %s', r.nombre);
      end loop;
    end if;

  elsif h.etapa_id = 5 then
    if current_date < h.fecha_fin then f := f || 'El evento aún no termina'::text; end if;
    if t.es_evento and h.asistentes_reales is null then f := f || 'Falta la asistencia real registrada por el organizador'::text; end if;

  elsif h.etapa_id = 6 then
    if not exists (select 1 from publicaciones where hito_id = p_hito) then
      f := f || 'Falta registrar al menos una publicación'::text;
    end if;

  elsif h.etapa_id = 7 then
    if t.es_evento and h.asistentes_reales is null then f := f || 'Falta la asistencia real'::text; end if;
    if t.es_evento and pres.costo_real is null then f := f || 'Falta el costo real del hito'::text; end if;
    if t.usa_captura then
      for r in select v.nombre from hito_verticales hv join verticales v on v.id = hv.vertical_id
               where hv.hito_id = p_hito and hv.rol <> 'no_va'
                 and not exists (select 1 from resultados_leads rl where rl.hito_id = p_hito and rl.vertical_id = hv.vertical_id) loop
        f := f || format('Faltan los resultados del CRM de %s', r.nombre);
      end loop;
    end if;
    if coalesce((select count(*) from cierres c, unnest(c.aprendizajes) a
                 where c.hito_id = p_hito and length(trim(a)) > 0), 0) < 3 then
      f := f || 'Faltan los 3 aprendizajes'::text;
    end if;
  end if;

  for r in select p.nombre from entregables en join plantillas_entregables p on p.id = en.plantilla_id
           where en.hito_id = p_hito and p.etapa_id = h.etapa_id and p.obligatorio and not en.completo
           order by p.orden loop
    f := f || format('Entregable pendiente: %s', r.nombre);
  end loop;

  return f;
end $$;

create or replace function avanzar_etapa(
  p_hito uuid, p_comentario text default null, p_forzar boolean default false, p_motivo text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v rol_app := mi_rol(); h hitos; e etapas; sig etapas; f text[]; t tipos_hito;
  v_detalle text; v_roles rol_app[];
begin
  if v is null then raise exception 'Sin sesión activa'; end if;
  select * into h from hitos where id = p_hito for update;
  if not found then raise exception 'El hito no existe'; end if;
  if h.estado <> 'activo' then raise exception 'El hito está % y no puede avanzar', h.estado; end if;
  select * into e from etapas where id = h.etapa_id;
  select * into t from tipos_hito where tipo = h.tipo;

  if p_forzar then
    if v <> 'admin' then raise exception 'Solo un administrador puede forzar el avance'; end if;
    if coalesce(trim(p_motivo),'') = '' then raise exception 'El motivo es obligatorio para forzar el avance'; end if;
  else
    if not (v = any(e.roles_aprobadores)) or not puede(p_hito, modulo_de_etapa(e.id), 'w') then
      raise exception 'Tu rol no aprueba la compuerta de %', e.nombre;
    end if;
    f := faltantes_compuerta(p_hito);
    if array_length(f, 1) > 0 then
      return jsonb_build_object('ok', false, 'faltantes', to_jsonb(f), 'etapa', e.nombre);
    end if;
  end if;

  perform set_config('tejido.interno','on',true);

  update hito_etapas set estado = 'aprobada', aprobada_por = auth.uid(), aprobada_en = now(),
         comentario = p_comentario, forzada = p_forzar, motivo = p_motivo
   where hito_id = p_hito and etapa_id = e.id;

  if e.id = 3 then update narrativas set aprobada = true where hito_id = p_hito; end if;

  select * into sig from etapas
   where orden > e.orden and id not in (select etapa_id from hito_etapas where hito_id = p_hito and estado = 'omitida')
   order by orden limit 1;

  if not found then
    update hitos set estado = 'cerrado', semaforo = 'verde' where id = p_hito;
    update cierres set cerrado_en = now() where hito_id = p_hito;
    perform set_config('tejido.interno','off',true);
    return jsonb_build_object('ok', true, 'cerrado', true);
  end if;

  update hito_etapas set estado = 'abierta', abierta_en = now(), vence_en = calcular_vence(p_hito, sig.id)
   where hito_id = p_hito and etapa_id = sig.id;
  update hitos set etapa_id = sig.id where id = p_hito;
  perform sincronizar_entregables(p_hito);

  select string_agg(p.nombre, ', ' order by p.orden) into v_detalle
    from plantillas_entregables p
   where p.etapa_id = sig.id and p.obligatorio and (p.tipo_hito is null or p.tipo_hito = h.tipo);

  v_roles := array[sig.rol_dueno];
  if sig.id = 4 and t.es_social then v_roles := array['lider_impacto']::rol_app[]; end if;
  perform notificar_roles(v_roles, p_hito, 'etapa_abierta',
    format('%s: entra a %s', h.nombre, sig.nombre),
    coalesce('Te toca entregar: ' || v_detalle, 'Revisa lo que falta en el detalle del hito'),
    format('etapa-%s-%s', p_hito, sig.id));
  perform notificar_roles('{admin}', p_hito, 'etapa_abierta',
    format('%s pasó a %s', h.nombre, sig.nombre), null, format('etapa-adm-%s-%s', p_hito, sig.id));

  perform set_config('tejido.interno','off',true);
  perform refrescar_semaforos(p_hito);
  return jsonb_build_object('ok', true, 'etapa_id', sig.id, 'etapa', sig.nombre);
end $$;

create or replace function cambiar_estado_hito(p_hito uuid, p_estado estado_hito, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_estado = 'cerrado' then raise exception 'Un hito solo se cierra desde la compuerta de Cierre'; end if;
  if mi_rol() not in ('admin','lider_eventos','lider_impacto') or not puede(p_hito, 'ficha', 'w') then
    raise exception 'Tu rol no puede cambiar el estado del hito';
  end if;
  if p_estado in ('en_pausa','descartado') and coalesce(trim(p_motivo),'') = '' then
    raise exception 'El motivo es obligatorio';
  end if;
  perform set_config('tejido.interno','on',true);
  update hitos set estado = p_estado, motivo_estado = case when p_estado = 'activo' then null else p_motivo end
   where id = p_hito;
  perform set_config('tejido.interno','off',true);
  perform refrescar_semaforos(p_hito);
end $$;

create or replace function eliminar_hito(p_hito uuid, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'Solo un administrador puede borrar hitos'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'El motivo es obligatorio'; end if;
  perform set_config('tejido.motivo', p_motivo, true);
  delete from hitos where id = p_hito;
  perform set_config('tejido.motivo', '', true);
end $$;

create or replace function admin_actualizar_usuario(p_user uuid, p_rol rol_app, p_activo boolean, p_motivo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'Solo un administrador gestiona usuarios'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'El motivo es obligatorio'; end if;
  if p_user = auth.uid() and (p_rol <> 'admin' or not p_activo) then
    raise exception 'No puedes quitarte el acceso de administrador a ti mismo';
  end if;
  perform set_config('tejido.motivo', p_motivo, true);
  update profiles set rol = p_rol, activo = p_activo where id = p_user;
  perform set_config('tejido.motivo', '', true);
end $$;

-- ───────────── Crear y duplicar hitos ─────────────
create or replace function crear_hito(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v rol_app := mi_rol(); v_eje smallint := (p->>'eje_id')::smallint;
  v_id uuid; v_slug text; v_base text; i int := 1; pc text; v_primero boolean := true;
begin
  if v is null or v not in ('admin','lider_eventos','marcom','lider_impacto') then
    raise exception 'Tu rol no puede crear hitos';
  end if;
  if v = 'lider_impacto' and v_eje <> 4 then raise exception 'El líder de impacto solo crea hitos del eje social'; end if;
  if jsonb_array_length(coalesce(p->'paises','[]'::jsonb)) = 0 then raise exception 'Indica al menos un país'; end if;

  v_base := slugify(p->>'nombre') || '-' || extract(year from (p->>'fecha_inicio')::date)::int;
  v_slug := v_base;
  while exists (select 1 from hitos where slug = v_slug) loop i := i + 1; v_slug := v_base || '-' || i; end loop;

  insert into hitos (nombre, slug, tipo, eje_id, ejes_secundarios, fecha_inicio, fecha_fin, hora_inicio, ciudad, venue,
                     organizador, url, asistentes_estimados, moneda, fecha_por_confirmar, creado_por, responsable_id)
  values (p->>'nombre', v_slug, (p->>'tipo')::tipo_hito, v_eje,
          coalesce(array(select jsonb_array_elements_text(p->'ejes_secundarios'))::smallint[], '{}'),
          (p->>'fecha_inicio')::date, coalesce((p->>'fecha_fin')::date, (p->>'fecha_inicio')::date), nullif(p->>'hora_inicio','')::time,
          nullif(p->>'ciudad',''), nullif(p->>'venue',''), nullif(p->>'organizador',''), nullif(p->>'url',''),
          nullif(p->>'asistentes_estimados','')::int, coalesce(nullif(p->>'moneda',''),'COP'),
          coalesce((p->>'fecha_por_confirmar')::boolean, false), auth.uid(), auth.uid())
  returning id into v_id;

  for pc in select jsonb_array_elements_text(p->'paises') loop
    insert into hito_paises (hito_id, pais_codigo, principal) values (v_id, pc, v_primero);
    v_primero := false;
  end loop;

  update presupuestos set costo_estimado = nullif(p->>'costo_estimado','')::numeric where hito_id = v_id;
  insert into hito_asignaciones (hito_id, user_id, funcion) values (v_id, auth.uid(), 'responsable')
    on conflict do nothing;
  return v_id;
end $$;

create or replace function duplicar_hito(p_hito uuid, p_fecha_inicio date, p_fecha_fin date) returns uuid
language plpgsql security definer set search_path = public as $$
declare o hitos; v_id uuid; pres presupuestos;
begin
  if mi_rol() not in ('admin','lider_eventos','marcom','lider_impacto') then raise exception 'Tu rol no puede crear hitos'; end if;
  select * into o from hitos where id = p_hito;
  if not found then raise exception 'El hito no existe'; end if;
  select * into pres from presupuestos where hito_id = p_hito;
  v_id := crear_hito(jsonb_build_object(
    'nombre', o.nombre, 'tipo', o.tipo, 'eje_id', o.eje_id, 'ejes_secundarios', to_jsonb(o.ejes_secundarios),
    'fecha_inicio', p_fecha_inicio, 'fecha_fin', p_fecha_fin, 'ciudad', o.ciudad, 'venue', o.venue,
    'organizador', o.organizador, 'url', o.url, 'asistentes_estimados', o.asistentes_estimados,
    'moneda', o.moneda, 'costo_estimado', pres.costo_estimado,
    'paises', (select coalesce(jsonb_agg(pais_codigo order by principal desc), '[]'::jsonb) from hito_paises where hito_id = p_hito)));
  insert into hito_verticales (hito_id, vertical_id, pertinencia, importancia, rol, audiencia_objetivo, meta_leads)
    select v_id, vertical_id, pertinencia, importancia, rol, audiencia_objetivo, meta_leads
    from hito_verticales where hito_id = p_hito;
  return v_id;
end $$;

-- ───────────── Semáforo y alertas ─────────────
-- Ámbar: la compuerta abierta venció su plazo. Rojo: además faltan menos de 7 días para el evento.
create or replace function refrescar_semaforos(p_hito uuid default null) returns int
language plpgsql security definer set search_path = public as $$
declare
  r record; v_nuevo semaforo; n int := 0; f text[]; v_vencida boolean; v_antes semaforo;
begin
  perform set_config('tejido.interno','on',true);
  for r in
    select h.id, h.nombre, h.semaforo, h.etapa_id, h.fecha_inicio, h.fecha_fin, h.estado, e.nombre as etapa, e.rol_dueno,
           e.roles_aprobadores, he.vence_en
    from hitos h
    join etapas e on e.id = h.etapa_id
    join hito_etapas he on he.hito_id = h.id and he.etapa_id = h.etapa_id
    where (p_hito is null or h.id = p_hito) and h.estado in ('activo','cerrado')
  loop
    v_vencida := r.estado = 'activo' and r.vence_en is not null and r.vence_en < now();
    v_nuevo := case
      when not v_vencida then 'verde'
      when (r.fecha_inicio - current_date) between 0 and 6 then 'rojo'
      else 'ambar' end;
    if v_nuevo <> r.semaforo then
      update hitos set semaforo = v_nuevo where id = r.id;
      n := n + 1;
    end if;

    if v_vencida then
      perform notificar_roles(array[r.rol_dueno,'admin']::rol_app[], r.id, 'compuerta_vencida',
        format('%s: la compuerta de %s está vencida', r.nombre, r.etapa),
        case when r.etapa_id = 6 then 'Venció la ventana de 48 h sin publicación' else 'Superó el plazo sugerido' end,
        format('venc-%s-%s-%s', r.id, r.etapa_id, v_nuevo));
    elsif r.estado = 'activo' then
      f := faltantes_compuerta(r.id);
      if coalesce(array_length(f,1),0) = 0 then
        perform notificar_roles(r.roles_aprobadores, r.id, 'compuerta_lista',
          format('%s: la compuerta de %s está lista para aprobar', r.nombre, r.etapa), null,
          format('lista-%s-%s', r.id, r.etapa_id));
      end if;
    end if;

    -- ventana de 48 h
    if r.estado = 'activo' and r.etapa_id = 6 and r.fecha_fin <= current_date then
      perform notificar_roles('{marcom}', r.id, 'ventana_48h',
        format('Empezó la ventana de 48 h de %s', r.nombre),
        'Publica la primera nota antes de que se cumplan 48 h del cierre del evento.',
        format('48h-%s', r.id));
    end if;
  end loop;
  perform set_config('tejido.interno','off',true);
  return n;
end $$;

-- Alerta al transversal: país de prioridad alta/media sin hitos a 30 días del cierre del trimestre
create or replace function alerta_paises(p_hoy date default current_date) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_ini date := date_trunc('quarter', p_hoy)::date;
  v_fin date := (date_trunc('quarter', p_hoy) + interval '3 months - 1 day')::date;
  v_trim text := to_char(p_hoy, 'YYYY') || '-Q' || extract(quarter from p_hoy)::int;
  r record; n int := 0;
begin
  if v_fin - p_hoy > 30 then return 0; end if;
  for r in
    select p.codigo, p.nombre from paises p
    where p.prioridad in ('alta','media_alta','media')
      and not exists (
        select 1 from hito_paises hp join hitos h on h.id = hp.hito_id
        where hp.pais_codigo = p.codigo and h.estado <> 'descartado'
          and h.fecha_inicio <= v_fin and h.fecha_fin >= v_ini)
  loop
    perform notificar_roles('{admin}', null, 'pais_sin_presencia',
      format('%s no tiene hitos en %s', r.nombre, v_trim),
      'Es un país de prioridad alta o media y el trimestre cierra en menos de 30 días.',
      format('pais-%s-%s', r.codigo, v_trim));
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function tareas_programadas() returns void
language plpgsql security definer set search_path = public as $$
begin
  perform refrescar_semaforos(null);
  perform alerta_paises();
  update cifras set estado = 'vencida' where estado = 'validada' and vigente_hasta < current_date;
end $$;
