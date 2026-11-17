'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { actualizar, escribir, flag, num, str, traducir } from '@/lib/acciones-util'
import type { Resultado } from '@/lib/types'

const P = (id: string) => [`/hitos/${id}`, '/hitos', '/inicio', '/calendario']

// ───────── Crear / duplicar ─────────
const NuevoHito = z.object({
  nombre: z.string().min(3, 'Escribe el nombre del hito'),
  tipo: z.enum(['evento_externo', 'evento_propio', 'medios', 'ranking_premio', 'gremio_gobierno', 'accion_social', 'campana']),
  eje_id: z.coerce.number().int().min(1).max(4),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Indica la fecha de inicio'),
  fecha_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
})

export async function crearHito(_: unknown, fd: FormData): Promise<Resultado> {
  const parsed = NuevoHito.safeParse(Object.fromEntries(fd))
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message }
  const principal = str(fd, 'pais_principal')
  if (!principal) return { ok: false, error: 'Elige el país principal' }
  const paises = [principal, ...fd.getAll('paises').map(String).filter((p) => p && p !== principal)]
  const fin = parsed.data.fecha_fin || parsed.data.fecha_inicio
  if (fin < parsed.data.fecha_inicio) return { ok: false, error: 'La fecha de fin no puede ser anterior al inicio' }
  const payload = {
    ...parsed.data, fecha_fin: fin, paises,
    ejes_secundarios: fd.getAll('ejes_secundarios').map(Number).filter((n) => n && n !== parsed.data.eje_id),
    hora_inicio: str(fd, 'hora_inicio'), ciudad: str(fd, 'ciudad'), venue: str(fd, 'venue'), organizador: str(fd, 'organizador'),
    url: str(fd, 'url'), asistentes_estimados: num(fd, 'asistentes_estimados'), costo_estimado: num(fd, 'costo_estimado'),
    moneda: str(fd, 'moneda') ?? 'COP', fecha_por_confirmar: flag(fd, 'fecha_por_confirmar'),
  }
  const sb = await createClient()
  const { data, error } = await sb.rpc('crear_hito', { p: payload })
  if (error) return { ok: false, error: traducir(error.message) }
  revalidatePath('/hitos'); revalidatePath('/calendario')
  redirect(`/hitos/${data}`)
}

export async function duplicarHito(id: string, fd: FormData): Promise<Resultado> {
  const ini = str(fd, 'fecha_inicio'); const fin = str(fd, 'fecha_fin') ?? ini
  if (!ini || !fin) return { ok: false, error: 'Indica las nuevas fechas' }
  const sb = await createClient()
  const { data, error } = await sb.rpc('duplicar_hito', { p_hito: id, p_fecha_inicio: ini, p_fecha_fin: fin })
  if (error) return { ok: false, error: traducir(error.message) }
  revalidatePath('/hitos')
  redirect(`/hitos/${data}`)
}

// ───────── Ficha, países, asignaciones ─────────
export async function guardarFicha(id: string, fd: FormData): Promise<Resultado> {
  const ini = str(fd, 'fecha_inicio'); const fin = str(fd, 'fecha_fin') ?? ini
  if (!ini || !fin || fin < ini) return { ok: false, error: 'Revisa las fechas' }
  const r = await actualizar((sb) => sb.from('hitos').update({
    nombre: str(fd, 'nombre'), tipo: str(fd, 'tipo'), eje_id: num(fd, 'eje_id'),
    ejes_secundarios: fd.getAll('ejes_secundarios').map(Number).filter(Boolean),
    fecha_inicio: ini, fecha_fin: fin, hora_inicio: str(fd, 'hora_inicio'), ciudad: str(fd, 'ciudad'), venue: str(fd, 'venue'),
    organizador: str(fd, 'organizador'), url: str(fd, 'url'), asistentes_estimados: num(fd, 'asistentes_estimados'),
    asistentes_reales: num(fd, 'asistentes_reales'), moneda: str(fd, 'moneda') ?? 'COP',
    fecha_por_confirmar: flag(fd, 'fecha_por_confirmar'),
  }).eq('id', id).select('id'), P(id))
  if (!r.ok) return r
  // costo estimado vive en la tabla restringida; si el rol no la lee, se ignora sin error
  const ce = num(fd, 'costo_estimado')
  if (fd.has('costo_estimado')) {
    const sb = await createClient()
    await sb.from('presupuestos').update({ costo_estimado: ce }).eq('hito_id', id)
  }
  return r
}

export async function guardarPaises(id: string, fd: FormData): Promise<Resultado> {
  const paises = fd.getAll('paises').map(String).filter(Boolean)
  const principal = str(fd, 'principal') ?? paises[0]
  if (paises.length === 0) return { ok: false, error: 'Elige al menos un país' }
  const sb = await createClient()
  const del = await sb.from('hito_paises').delete().eq('hito_id', id)
  if (del.error) return { ok: false, error: traducir(del.error.message) }
  const { error } = await sb.from('hito_paises').insert(paises.map((p) => ({ hito_id: id, pais_codigo: p, principal: p === principal })))
  if (error) return { ok: false, error: traducir(error.message) }
  P(id).forEach((p) => revalidatePath(p))
  return { ok: true, mensaje: 'Países guardados' }
}

export async function asignar(id: string, fd: FormData): Promise<Resultado> {
  const user = str(fd, 'user_id')
  if (!user) return { ok: false, error: 'Elige una persona' }
  return escribir((sb) => sb.from('hito_asignaciones').upsert({ hito_id: id, user_id: user, funcion: str(fd, 'funcion') ?? 'ejecucion' }), P(id), 'Asignada')
}
export async function quitarAsignacion(id: string, user: string): Promise<Resultado> {
  return escribir((sb) => sb.from('hito_asignaciones').delete().eq('hito_id', id).eq('user_id', user), P(id), 'Quitada')
}

// ───────── Compuertas ─────────
export async function avanzar(id: string, fd: FormData): Promise<Resultado> {
  const forzar = flag(fd, 'forzar')
  const sb = await createClient()
  const { data, error } = await sb.rpc('avanzar_etapa', {
    p_hito: id, p_comentario: str(fd, 'comentario'), p_forzar: forzar, p_motivo: str(fd, 'motivo'),
  })
  if (error) return { ok: false, error: traducir(error.message) }
  const r = data as { ok: boolean; faltantes?: string[]; etapa?: string; cerrado?: boolean }
  if (!r.ok) return { ok: false, error: `No se puede aprobar la compuerta de ${r.etapa}`, faltantes: r.faltantes }
  P(id).forEach((p) => revalidatePath(p))
  return { ok: true, mensaje: r.cerrado ? 'Hito cerrado' : 'Compuerta aprobada' }
}

export async function moverEtapa(id: string): Promise<Resultado> {
  // Usado por el kanban: arrastrar a la siguiente columna = aprobar la compuerta actual
  return avanzar(id, new FormData())
}

export async function cambiarEstado(id: string, fd: FormData): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.rpc('cambiar_estado_hito', { p_hito: id, p_estado: str(fd, 'estado'), p_motivo: str(fd, 'motivo') })
  if (error) return { ok: false, error: traducir(error.message) }
  P(id).forEach((p) => revalidatePath(p))
  return { ok: true, mensaje: 'Estado actualizado' }
}

export async function eliminarHito(id: string, fd: FormData): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.rpc('eliminar_hito', { p_hito: id, p_motivo: str(fd, 'motivo') })
  if (error) return { ok: false, error: traducir(error.message) }
  revalidatePath('/hitos'); revalidatePath('/calendario')
  redirect('/hitos')
}

// ───────── Evaluación y matriz de verticales ─────────
export async function guardarEvaluacion(id: string, fd: FormData): Promise<Resultado> {
  const campos = ['audiencia', 'mercado', 'mensaje', 'rol_posible', 'costo_resultado', 'competencia']
  const v: Record<string, number | string | null> = {}
  for (const c of campos) {
    const n = num(fd, c)
    if (n != null && (n < 1 || n > 5)) return { ok: false, error: 'Cada criterio va de 1 a 5' }
    v[c] = n
  }
  v.notas = str(fd, 'notas'); v.actualizado_en = new Date().toISOString()
  return actualizar((sb) => sb.from('evaluaciones').update(v).eq('hito_id', id).select('hito_id'), P(id))
}

export async function guardarVertical(id: string, fd: FormData): Promise<Resultado> {
  const vertical = num(fd, 'vertical_id')
  if (!vertical) return { ok: false, error: 'Elige una vertical' }
  const pert = num(fd, 'pertinencia') ?? 3, imp = num(fd, 'importancia') ?? 3
  if ([pert, imp].some((n) => n < 1 || n > 5)) return { ok: false, error: 'Pertinencia e importancia van de 1 a 5' }
  const conf = flag(fd, 'rol_confirmado')
  return escribir((sb) => sb.from('hito_verticales').upsert({
    hito_id: id, vertical_id: vertical, pertinencia: pert, importancia: imp, rol_confirmado: conf,
    ...(conf && str(fd, 'rol') ? { rol: str(fd, 'rol') } : {}),
    audiencia_objetivo: num(fd, 'audiencia_objetivo'), meta_leads: num(fd, 'meta_leads'),
    participacion_costo: num(fd, 'participacion_costo') != null ? num(fd, 'participacion_costo')! / 100 : null,
  }), P(id))
}
export async function quitarVertical(id: string, vertical: number): Promise<Resultado> {
  return escribir((sb) => sb.from('hito_verticales').delete().eq('hito_id', id).eq('vertical_id', vertical), P(id), 'Quitada')
}

// ───────── Datos ─────────
export async function vincularCifra(id: string, fd: FormData): Promise<Resultado> {
  const c = str(fd, 'cifra_id')
  if (!c) return { ok: false, error: 'Elige una cifra' }
  return escribir((sb) => sb.from('hito_cifras').upsert({ hito_id: id, cifra_id: c }), P(id), 'Cifra vinculada')
}
export async function desvincularCifra(id: string, cifra: string): Promise<Resultado> {
  return escribir((sb) => sb.from('hito_cifras').delete().eq('hito_id', id).eq('cifra_id', cifra), P(id), 'Cifra desvinculada')
}

// ───────── Narrativa ─────────
export async function guardarNarrativa(id: string, fd: FormData): Promise<Resultado> {
  return actualizar((sb) => sb.from('narrativas').update({
    mensaje_clave: str(fd, 'mensaje_clave'), vocero_id: num(fd, 'vocero_id'), audiencia: str(fd, 'audiencia'),
    momento: str(fd, 'momento'), plan_medios: str(fd, 'plan_medios'), actualizado_en: new Date().toISOString(),
  }).eq('hito_id', id).select('hito_id'), P(id))
}
export async function agregarPieza(id: string, fd: FormData): Promise<Resultado> {
  const t = str(fd, 'titulo')
  if (!t) return { ok: false, error: 'Escribe el título de la pieza' }
  return escribir((sb) => sb.from('piezas').insert({ hito_id: id, tipo: str(fd, 'tipo') ?? 'otra', titulo: t, url: str(fd, 'url'), estado: str(fd, 'estado') ?? 'pendiente' }), P(id), 'Pieza agregada')
}
export async function estadoPieza(id: string, pieza: string, fd: FormData): Promise<Resultado> {
  return actualizar((sb) => sb.from('piezas').update({ estado: str(fd, 'estado'), url: str(fd, 'url') }).eq('id', pieza).select('id'), P(id))
}
export async function borrarPieza(id: string, pieza: string): Promise<Resultado> {
  return escribir((sb) => sb.from('piezas').delete().eq('id', pieza), P(id), 'Pieza eliminada')
}

// ───────── Evento: stand, checklist, costos, presupuesto, entregables ─────────
export async function guardarStand(id: string, fd: FormData): Promise<Resultado> {
  const a = num(fd, 'ancho_m'), f = num(fd, 'fondo_m')
  if ((a != null && a <= 0) || (f != null && f <= 0)) return { ok: false, error: 'Las medidas deben ser mayores a 0' }
  return actualizar((sb) => sb.from('stands').update({
    ancho_m: a, fondo_m: f, tipo: str(fd, 'tipo'), concepto: str(fd, 'concepto'), proveedores: str(fd, 'proveedores'),
    cronograma_montaje: str(fd, 'cronograma_montaje'),
  }).eq('hito_id', id).select('hito_id'), P(id))
}

export async function agregarChecklist(id: string, fd: FormData): Promise<Resultado> {
  const c = str(fd, 'concepto')
  if (!c) return { ok: false, error: 'Escribe la tarea' }
  return escribir((sb) => sb.from('checklist_items').insert({
    hito_id: id, concepto: c, responsable_id: str(fd, 'responsable_id'), vence_en: str(fd, 'vence_en'), critico: flag(fd, 'critico'),
  }), P(id), 'Tarea agregada')
}
export async function actualizarChecklist(id: string, item: string, fd: FormData): Promise<Resultado> {
  return actualizar((sb) => sb.from('checklist_items').update({ completo: flag(fd, 'completo') }).eq('id', item).select('id'), P(id))
}
export async function borrarChecklist(id: string, item: string): Promise<Resultado> {
  return escribir((sb) => sb.from('checklist_items').delete().eq('id', item), P(id), 'Tarea eliminada')
}

export async function agregarCosto(id: string, fd: FormData): Promise<Resultado> {
  const c = str(fd, 'concepto')
  if (!c) return { ok: false, error: 'Escribe el concepto' }
  return escribir((sb) => sb.from('costos_items').insert({
    hito_id: id, concepto: c, proveedor: str(fd, 'proveedor'), valor: num(fd, 'valor') ?? 0, moneda: str(fd, 'moneda') ?? 'COP',
    estado_pago: str(fd, 'estado_pago') ?? 'pendiente',
  }), P(id), 'Costo agregado')
}
export async function actualizarCosto(id: string, item: string, fd: FormData): Promise<Resultado> {
  return actualizar((sb) => sb.from('costos_items').update({ estado_pago: str(fd, 'estado_pago') }).eq('id', item).select('id'), P(id))
}
export async function borrarCosto(id: string, item: string): Promise<Resultado> {
  return escribir((sb) => sb.from('costos_items').delete().eq('id', item), P(id), 'Costo eliminado')
}

export async function guardarPresupuesto(id: string, fd: FormData): Promise<Resultado> {
  const v: Record<string, number | null> = {}
  for (const k of ['costo_estimado', 'presupuesto_total', 'costo_real']) if (fd.has(k)) v[k] = num(fd, k)
  return actualizar((sb) => sb.from('presupuestos').update(v).eq('hito_id', id).select('hito_id'), P(id))
}

export async function guardarEntregable(id: string, entregable: string, fd: FormData): Promise<Resultado> {
  return actualizar((sb) => sb.from('entregables').update({
    valor: str(fd, 'valor') != null ? { texto: str(fd, 'valor') } : null, completo: flag(fd, 'completo'), actualizado_en: new Date().toISOString(),
  }).eq('id', entregable).select('id'), P(id))
}

// ───────── Archivos privados (Storage: bucket "archivos", ruta {hito}/{carpeta}/{archivo}) ─────────
export async function registrarArchivo(id: string, tipo: 'plano' | 'render' | 'acta', path: string): Promise<Resultado> {
  if (!path.startsWith(`${id}/`)) return { ok: false, error: 'Ruta de archivo inválida' }
  const sb = await createClient()
  if (tipo === 'plano') return actualizar((s) => s.from('stands').update({ plano_path: path }).eq('hito_id', id).select('hito_id'), P(id))
  if (tipo === 'acta') return escribir((s) => s.from('acciones_sociales').upsert({ hito_id: id, acta_path: path }, { onConflict: 'hito_id' }), P(id), 'Acta cargada')
  const { data } = await sb.from('stands').select('renders').eq('hito_id', id).maybeSingle()
  return actualizar((s) => s.from('stands').update({ renders: [...(data?.renders ?? []), path] }).eq('hito_id', id).select('hito_id'), P(id))
}
export async function quitarRender(id: string, path: string): Promise<Resultado> {
  const sb = await createClient()
  const { data } = await sb.from('stands').select('renders').eq('hito_id', id).maybeSingle()
  await sb.storage.from('archivos').remove([path])
  return actualizar((s) => s.from('stands').update({ renders: (data?.renders ?? []).filter((r: string) => r !== path) }).eq('hito_id', id).select('hito_id'), P(id))
}
