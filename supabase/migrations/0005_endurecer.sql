-- Endurecimiento tras el linter de Supabase.
-- 1) search_path fijo en funciones de disparador y utilidades.
alter function slugify(text) set search_path = public;
alter function interno() set search_path = public;
alter function modulo_de_etapa(smallint) set search_path = public;
alter function actividad_inmutable() set search_path = public;
alter function hito_proteger() set search_path = public;
alter function narrativa_proteger() set search_path = public;
alter function plan_proteger() set search_path = public;
alter function vertical_rol_sugerido() set search_path = public;
alter function cifra_validar() set search_path = public;

-- 2) Las funciones de disparador no deben ser invocables como RPC por usuarios (no necesitan EXECUTE al dispararse).
revoke execute on function
  asignacion_notificar(), audit_row(), evaluacion_total(), handle_new_user(), hito_fechas_cambian(), hito_inicializar()
  from authenticated, anon, public;

-- Nota: v_calendario es SECURITY DEFINER a propósito (el perfil Consulta no tiene select sobre las tablas base).
-- mi_rol(), es_admin(), es_staff(), en_alcance() y puede() deben seguir ejecutables: las usan las políticas RLS.
