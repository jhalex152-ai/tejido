import 'server-only'
import { cache } from 'react'
import { createClient } from './supabase/server'
import type { Eje, Etapa, Hito, Pais, Vertical } from './types'

export const HITO_SELECT =
  'id,nombre,slug,tipo,eje_id,ejes_secundarios,fecha_inicio,fecha_fin,hora_inicio,ciudad,venue,organizador,url,asistentes_estimados,asistentes_reales,moneda,etapa_id,estado,motivo_estado,semaforo,responsable_id,puntaje_evaluacion,fecha_por_confirmar,hito_paises(pais_codigo,principal),hito_etapas(etapa_id,estado,vence_en,abierta_en,aprobada_en,forzada,motivo,comentario)'

export const getCatalogos = cache(async () => {
  const sb = await createClient()
  const [ejes, paises, etapas, verticales, monedas, config] = await Promise.all([
    sb.from('ejes').select('*').order('id'),
    sb.from('paises').select('*').order('nombre'),
    sb.from('etapas').select('*').order('orden'),
    sb.from('verticales').select('*').eq('activa', true).order('nombre'),
    sb.from('monedas').select('*').order('codigo'),
    sb.from('configuracion').select('*'),
  ])
  const umbrales = (config.data ?? []).find((c) => c.clave === 'semaforo_umbrales')?.valor ?? { verde: 90, ambar: 60 }
  return {
    ejes: (ejes.data ?? []) as Eje[],
    paises: (paises.data ?? []) as Pais[],
    etapas: (etapas.data ?? []) as Etapa[],
    verticales: (verticales.data ?? []) as Vertical[],
    monedas: (monedas.data ?? []) as { codigo: string; cop_por_unidad: number; usd_por_unidad: number }[],
    umbrales: umbrales as { verde: number; ambar: number },
  }
})

export async function listarHitos(): Promise<Hito[]> {
  const sb = await createClient()
  const { data } = await sb.from('hitos').select(HITO_SELECT).order('fecha_inicio', { ascending: true })
  return (data ?? []) as unknown as Hito[]
}

export async function listarPersonas() {
  const sb = await createClient()
  const { data } = await sb.from('profiles').select('id,nombre,rol,activo').eq('activo', true).neq('rol', 'consulta').order('nombre')
  return (data ?? []) as { id: string; nombre: string; rol: string; activo: boolean }[]
}
