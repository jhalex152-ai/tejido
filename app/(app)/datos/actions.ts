'use server'
import { z } from 'zod'
import { actualizar, escribir, num, str } from '@/lib/acciones-util'
import type { Resultado } from '@/lib/types'

const Cifra = z.object({
  enunciado: z.string().min(5, 'Escribe el enunciado de la cifra'),
  fuente: z.string().min(2, 'Indica la fuente'),
  fecha_corte: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Indica la fecha de corte'),
  eje_id: z.coerce.number().int().min(1).max(4),
})

export async function crearCifra(fd: FormData): Promise<Resultado> {
  const p = Cifra.safeParse(Object.fromEntries(fd))
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message }
  return escribir((sb) => sb.from('cifras').insert({
    ...p.data, pais_codigo: str(fd, 'pais_codigo'), valor: num(fd, 'valor'), valor_texto: str(fd, 'valor_texto'),
    unidad: str(fd, 'unidad'), vigente_hasta: str(fd, 'vigente_hasta'), estado: str(fd, 'estado') ?? 'borrador',
  }), ['/datos'], 'Cifra creada')
}

export async function estadoCifra(id: string, fd: FormData): Promise<Resultado> {
  return actualizar((sb) => sb.from('cifras').update({
    estado: str(fd, 'estado'), vigente_hasta: str(fd, 'vigente_hasta'),
  }).eq('id', id).select('id'), ['/datos'])
}

export async function borrarCifra(id: string): Promise<Resultado> {
  return escribir((sb) => sb.from('cifras').delete().eq('id', id), ['/datos'], 'Cifra eliminada')
}
