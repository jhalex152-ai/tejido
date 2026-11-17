import { MOVILIZADORES } from './constants'
import type { HitoEtapa } from './types'

export type PuntoEstado = 'hecho' | 'actual' | 'pendiente' | 'omitido'

/** 4 puntos de progreso: Datos, Narrativa, Eventos, Medios */
export function puntosProgreso(etapas: HitoEtapa[] = []): { id: number; nombre: string; icono: string; estado: PuntoEstado }[] {
  return MOVILIZADORES.map((m) => {
    const es = etapas.filter((e) => (m.etapas as readonly number[]).includes(e.etapa_id))
    const vivas = es.filter((e) => e.estado !== 'omitida')
    let estado: PuntoEstado
    if (es.length > 0 && vivas.length === 0) estado = 'omitido'
    else if (vivas.length > 0 && vivas.every((e) => e.estado === 'aprobada')) estado = 'hecho'
    else if (vivas.some((e) => e.estado === 'abierta' || e.estado === 'aprobada')) estado = 'actual'
    else estado = 'pendiente'
    return { id: m.id, nombre: m.nombre, icono: m.icono, estado }
  })
}
