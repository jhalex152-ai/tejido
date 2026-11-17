import { createClient } from '@/lib/supabase/server'
import type { TabProps } from './tipos'

const ACC: Record<string, string> = {
  'etapa.aprobada': 'Compuerta aprobada', 'etapa.forzada': 'Avance forzado', 'hitos.insert': 'Hito creado', 'hitos.update': 'Hito editado',
  'hitos.delete': 'Hito borrado', 'planes_captura.update': 'Plan de captura editado', 'planes_captura.insert': 'Plan de captura creado',
  'resultados_leads.insert': 'Resultados cargados', 'resultados_leads.update': 'Resultados editados', 'publicaciones.insert': 'Publicación registrada',
  'publicaciones.delete': 'Publicación borrada', 'presupuestos.update': 'Presupuesto editado', 'costos_items.delete': 'Costo borrado',
}

export async function Actividad({ hito }: TabProps) {
  const sb = await createClient()
  const { data } = await sb.from('actividad').select('id,user_id,accion,motivo,creado_en,profiles:user_id(nombre)').eq('hito_id', hito.id).order('creado_en', { ascending: false }).limit(100)
  const filas = (data ?? []) as unknown as { id: number; accion: string; motivo: string | null; creado_en: string; profiles: { nombre: string } | null }[]
  return (
    <section className="card">
      <h2 className="mb-1 text-lg">Registro de actividad</h2>
      <p className="mb-4 text-[13px] text-ink-muted">Cambios de etapa, aprobaciones, forzados y borrados. Es inmutable.</p>
      <ul className="divide-y divide-line">
        {filas.map((f) => (
          <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-[14px]">
            <span><b>{ACC[f.accion] ?? f.accion}</b>{f.motivo && <span className="text-ink-muted"> · {f.motivo}</span>}</span>
            <span className="text-[12px] text-ink-muted">{f.profiles?.nombre ?? 'Sistema'} · {new Date(f.creado_en).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' })}</span>
          </li>
        ))}
        {filas.length === 0 && <li className="py-3 text-ink-muted">Sin actividad registrada.</li>}
      </ul>
    </section>
  )
}
