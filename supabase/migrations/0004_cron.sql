-- Tareas programadas (PRD §10: Edge Functions + pg_cron). Aquí: pg_cron llama a la función SQL
-- cada hora; el envío de correos lo hace la ruta /api/cron/notificar (Vercel Cron o pg_net).
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('tejido-tareas', '0 * * * *', 'select public.tareas_programadas()');
exception when others then
  raise notice 'pg_cron no disponible (%). Programa tareas_programadas() desde Vercel Cron: /api/cron/notificar', sqlerrm;
end $$;
