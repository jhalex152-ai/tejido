import 'server-only'
import { createClient } from './supabase/server'
import type { ItemCal } from '@/components/calendario/calendario'
import type { Calendario } from './types'

/** Calendario desde v_calendario (la misma vista que lee el perfil Consulta) + etapa/semáforo para el personal */
export async function cargarCalendario(conEtapa: boolean): Promise<ItemCal[]> {
  const sb = await createClient()
  const { data } = await sb.from('v_calendario').select('*').order('fecha_inicio')
  const filas = (data ?? []) as Calendario[]
  const extra = new Map<string, { etapa_id: number; semaforo: ItemCal['semaforo']; responsable_id: string | null }>()
  if (conEtapa) {
    const { data: h } = await sb.from('hitos').select('id,etapa_id,semaforo,responsable_id')
    ;(h ?? []).forEach((x) => extra.set(x.id, x))
  }
  return filas.map((c) => ({
    id: c.id, nombre: c.nombre, tipo: c.tipo, ini: c.fecha_inicio, fin: c.fecha_fin, porConfirmar: c.fecha_por_confirmar,
    paises: c.paises ?? [], ciudad: c.ciudad, venue: c.venue, ejeId: c.eje_id, eje: c.eje, color: c.eje_color, estado: c.estado,
    verticales: c.verticales ?? [], etapaId: extra.get(c.id)?.etapa_id, semaforo: extra.get(c.id)?.semaforo, responsableId: extra.get(c.id)?.responsable_id,
  }))
}
