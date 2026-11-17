'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { actualizar, escribir, flag, num, str, traducir } from '@/lib/acciones-util'
import { construirCanal } from '@/lib/utm'
import type { Resultado } from '@/lib/types'

const P = (id: string) => [`/hitos/${id}`, '/tablero', '/hitos']

// ───────── Plan de captura por vertical ─────────
export async function guardarPlan(id: string, fd: FormData): Promise<Resultado> {
  const vertical = num(fd, 'vertical_id')
  if (!vertical) return { ok: false, error: 'Falta la vertical' }
  return escribir((sb) => sb.from('planes_captura').upsert({
    hito_id: id, vertical_id: vertical, metodo: str(fd, 'metodo'), destino_crm: str(fd, 'destino_crm'),
    preguntas: str(fd, 'preguntas'), responsable: str(fd, 'responsable'), seguimiento_horas: num(fd, 'seguimiento_horas'),
    meta: num(fd, 'meta'),
  }, { onConflict: 'hito_id,vertical_id' }), P(id), 'Plan guardado')
}

export async function aprobarPlan(id: string, plan: string, aprobado: boolean): Promise<Resultado> {
  return actualizar((sb) => sb.from('planes_captura').update({ aprobado }).eq('id', plan).select('id'), P(id))
}

export async function generarCanal(id: string, plan: string, fd: FormData): Promise<Resultado> {
  const destino = str(fd, 'url_destino')
  if (!destino) return { ok: false, error: 'Pega el link del formulario o landing del CRM' }
  try { new URL(destino) } catch { return { ok: false, error: 'El link no es válido (incluye https://)' } }

  const sb = await createClient()
  const { data: p } = await sb.from('planes_captura').select('id, verticales(slug,codigo)').eq('id', plan).maybeSingle()
  const { data: h } = await sb.from('hitos').select('slug, fecha_inicio, hito_paises(pais_codigo,principal)').eq('id', id).maybeSingle()
  const v = (p as unknown as { verticales: { slug: string; codigo: string } } | null)?.verticales
  if (!p || !h || !v) return { ok: false, error: 'No se encontró el plan o el hito' }
  const pais = (h.hito_paises as { pais_codigo: string; principal: boolean }[]).find((x) => x.principal)?.pais_codigo ?? 'CO'

  // Si otro evento ya usa el mismo código (ej. dos "EXPO"), se agrega una letra: EXPO26B-ROAX
  for (const suf of ['', 'B', 'C', 'D', 'E', 'F']) {
    const c = construirCanal({ slug: h.slug, fechaInicio: h.fecha_inicio, verticalSlug: v.slug, verticalCodigo: v.codigo, paisISO: pais, urlDestino: destino, sufijo: suf })
    const { data: otro } = await sb.from('canales_captura').select('plan_id').eq('codigo', c.codigo).neq('plan_id', plan).maybeSingle()
    if (otro) continue
    const { error } = await sb.from('canales_captura').upsert(
      { plan_id: plan, codigo: c.codigo, url_destino: destino, utm: c.utm, url_final: c.urlFinal }, { onConflict: 'plan_id' })
    if (error) return { ok: false, error: traducir(error.message) }
    P(id).forEach((x) => revalidatePath(x))
    return { ok: true, mensaje: `Código ${c.codigo} generado` }
  }
  return { ok: false, error: 'No se pudo generar un código único' }
}

// ───────── Resultados agregados del CRM (sin datos personales) ─────────
const Resultados = z.object({
  capturados: z.number().int().min(0), calif_a: z.number().int().min(0), calif_b: z.number().int().min(0),
  calif_c: z.number().int().min(0), existentes: z.number().int().min(0), registros: z.number().int().min(0),
  activados_30d: z.number().int().min(0),
})

export async function guardarResultados(id: string, vertical: number, fd: FormData): Promise<Resultado> {
  const raw = Object.fromEntries(
    ['capturados', 'calif_a', 'calif_b', 'calif_c', 'existentes', 'registros', 'activados_30d'].map((k) => [k, num(fd, k) ?? 0]))
  const p = Resultados.safeParse(raw)
  if (!p.success) return { ok: false, error: 'Usa números enteros iguales o mayores a 0' }
  if (p.data.calif_a + p.data.calif_b + p.data.calif_c > p.data.capturados)
    return { ok: false, error: 'A + B + C no puede superar los leads capturados' }
  if (p.data.registros > p.data.capturados + p.data.existentes) return { ok: false, error: 'Los registros no pueden superar los leads' }
  const sb = await createClient()
  const { data: u } = await sb.auth.getUser()
  return escribir((s) => s.from('resultados_leads').upsert(
    { hito_id: id, vertical_id: vertical, ...p.data, fuente: 'manual', cargado_por: u.user?.id, cargado_en: new Date().toISOString() },
    { onConflict: 'hito_id,vertical_id' }), P(id), 'Resultados guardados')
}

// ───────── Social ─────────
export async function guardarAccionSocial(id: string, fd: FormData): Promise<Resultado> {
  return escribir((sb) => sb.from('acciones_sociales').upsert({
    hito_id: id, aliado_id: num(fd, 'aliado_id'), tipo: str(fd, 'tipo'), beneficiarios: num(fd, 'beneficiarios'),
    equipos_entregados: num(fd, 'equipos_entregados'),
  }, { onConflict: 'hito_id' }), P(id))
}

// ───────── Medios ─────────
export async function agregarPublicacion(id: string, fd: FormData): Promise<Resultado> {
  const medio = str(fd, 'medio')
  if (!medio) return { ok: false, error: 'Escribe el medio' }
  const fecha = str(fd, 'fecha')
  return escribir((sb) => sb.from('publicaciones').insert({
    hito_id: id, medio, pais_codigo: str(fd, 'pais_codigo'), tipo: str(fd, 'tipo') ?? 'ganado', url: str(fd, 'url'),
    fecha: fecha ? new Date(fecha).toISOString() : new Date().toISOString(), alcance: num(fd, 'alcance'), tono: str(fd, 'tono'),
    competidores: (str(fd, 'competidores') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  }), P(id), 'Publicación registrada')
}
export async function borrarPublicacion(id: string, pub: string): Promise<Resultado> {
  return escribir((sb) => sb.from('publicaciones').delete().eq('id', pub), P(id), 'Publicación eliminada')
}

// ───────── Cierre ─────────
export async function guardarCierre(id: string, fd: FormData): Promise<Resultado> {
  const aprendizajes = [1, 2, 3].map((n) => str(fd, `aprendizaje_${n}`) ?? '')
  return actualizar((sb) => sb.from('cierres').update({ aprendizajes, notas: str(fd, 'notas') }).eq('hito_id', id).select('hito_id'), P(id))
}
