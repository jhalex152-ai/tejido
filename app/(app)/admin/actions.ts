'use server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { actualizar, escribir, num, str, traducir } from '@/lib/acciones-util'
import { enviarCorreo, plantillaCorreo } from '@/lib/correo'
import type { Resultado } from '@/lib/types'

const A = ['/admin']
const Invitar = z.object({
  email: z.string().email('Correo inválido').transform((s) => s.toLowerCase()),
  rol: z.enum(['admin', 'lider_eventos', 'doer_eventos', 'lider_impacto', 'marcom', 'datos', 'consulta']),
})

export async function invitar(fd: FormData): Promise<Resultado> {
  const p = Invitar.safeParse(Object.fromEntries(fd))
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message }
  const sb = await createClient()
  const { data: u } = await sb.auth.getUser()
  const r = await escribir((s) => s.from('invitaciones').upsert(
    { email: p.data.email, rol: p.data.rol, nombre: str(fd, 'nombre'), invitado_por: u.user?.id }, { onConflict: 'email' }), A, 'Invitación creada')
  if (!r.ok) return r
  const url = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const enviado = await enviarCorreo(p.data.email, 'Te invitaron a Tejido',
    plantillaCorreo('Te invitaron a Tejido', 'Entra con este correo desde Google o con enlace mágico.', `${url}/login`))
  return { ok: true, mensaje: enviado ? 'Invitación creada y correo enviado' : 'Invitación creada (sin correo: configura RESEND_API_KEY). Ya puede entrar con ese correo.' }
}

export async function quitarInvitacion(email: string): Promise<Resultado> {
  return escribir((sb) => sb.from('invitaciones').delete().eq('email', email), A, 'Invitación eliminada')
}

export async function actualizarUsuario(user: string, fd: FormData): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await sb.rpc('admin_actualizar_usuario', {
    p_user: user, p_rol: str(fd, 'rol'), p_activo: fd.get('activo') === 'on', p_motivo: str(fd, 'motivo'),
  })
  if (error) return { ok: false, error: traducir(error.message) }
  return { ok: true, mensaje: 'Usuario actualizado' }
}

export async function actualizarPais(codigo: string, fd: FormData): Promise<Resultado> {
  return actualizar((sb) => sb.from('paises').update({
    prioridad: str(fd, 'prioridad'), estado: str(fd, 'estado'), moneda: str(fd, 'moneda'), zona_horaria: str(fd, 'zona_horaria'),
    contacto_local: str(fd, 'contacto_local'),
  }).eq('codigo', codigo).select('codigo'), [...A, '/paises'])
}

export async function guardarVerticalCatalogo(fd: FormData): Promise<Resultado> {
  const nombre = str(fd, 'nombre'), codigo = str(fd, 'codigo')?.toUpperCase()
  if (!nombre || !codigo || codigo.length !== 4) return { ok: false, error: 'Nombre y código de 4 letras son obligatorios' }
  const slug = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  let reglas = {}
  try { reglas = JSON.parse(str(fd, 'reglas') ?? '{}') } catch { return { ok: false, error: 'Las reglas A/B/C deben ser JSON válido, ej: {"A":"...","B":"...","C":"..."}' } }
  return escribir((sb) => sb.from('verticales').upsert(
    { nombre, slug, codigo, responsable: str(fd, 'responsable'), reglas_calificacion: reglas, activa: fd.get('activa') !== 'off' }, { onConflict: 'slug' }), A)
}

export async function guardarVocero(fd: FormData): Promise<Resultado> {
  const nombre = str(fd, 'nombre')
  if (!nombre) return { ok: false, error: 'Escribe el nombre' }
  return escribir((sb) => sb.from('voceros').insert({
    nombre, cargo: str(fd, 'cargo'), temas: (str(fd, 'temas') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  }), [...A], 'Vocero agregado')
}
export async function borrarVocero(id: number): Promise<Resultado> {
  return escribir((sb) => sb.from('voceros').delete().eq('id', id), A, 'Vocero eliminado')
}

export async function guardarMoneda(codigo: string, fd: FormData): Promise<Resultado> {
  const cop = num(fd, 'cop_por_unidad'), usd = num(fd, 'usd_por_unidad')
  if (!cop || !usd) return { ok: false, error: 'Las tasas deben ser mayores a 0' }
  return actualizar((sb) => sb.from('monedas').update({ cop_por_unidad: cop, usd_por_unidad: usd }).eq('codigo', codigo).select('codigo'), A)
}

export async function guardarUmbrales(fd: FormData): Promise<Resultado> {
  const v = num(fd, 'verde'), a = num(fd, 'ambar')
  if (v == null || a == null || a >= v || v > 100 || a < 0) return { ok: false, error: 'El umbral verde debe ser mayor al ámbar (0–100)' }
  return escribir((sb) => sb.from('configuracion').upsert({ clave: 'semaforo_umbrales', valor: { verde: v, ambar: a } }), [...A, '/tablero'])
}

export async function guardarMeta(fd: FormData): Promise<Resultado> {
  const trimestre = str(fd, 'trimestre'), nivel = str(fd, 'nivel'), clave = str(fd, 'clave'), meta = num(fd, 'meta')
  if (!trimestre || !/^\d{4}-Q[1-4]$/.test(trimestre) || !nivel || !clave || meta == null) return { ok: false, error: 'Completa trimestre (2027-Q1), nivel, clave y meta' }
  return escribir((sb) => sb.from('kpi_metas').upsert({ trimestre, nivel, clave, meta }, { onConflict: 'trimestre,nivel,clave' }), [...A, '/tablero'], 'Meta guardada')
}
export async function borrarMeta(id: number): Promise<Resultado> {
  return escribir((sb) => sb.from('kpi_metas').delete().eq('id', id), [...A, '/tablero'], 'Meta eliminada')
}

export async function agregarPlantilla(fd: FormData): Promise<Resultado> {
  const nombre = str(fd, 'nombre'), etapa = num(fd, 'etapa_id')
  if (!nombre || etapa == null) return { ok: false, error: 'Nombre y etapa son obligatorios' }
  const campo = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40)
  return escribir((sb) => sb.from('plantillas_entregables').insert({
    tipo_hito: str(fd, 'tipo_hito'), etapa_id: etapa, nombre, campo, obligatorio: fd.get('obligatorio') === 'on', critico: false, orden: 9,
  }), A, 'Entregable agregado a la plantilla')
}
export async function borrarPlantilla(id: number): Promise<Resultado> {
  return escribir((sb) => sb.from('plantillas_entregables').delete().eq('id', id), A, 'Entregable eliminado')
}
