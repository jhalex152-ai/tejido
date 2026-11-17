import 'server-only'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseNumero } from '@/lib/numeros'
import type { Resultado } from '@/lib/types'

export const str = (fd: FormData, k: string): string | null => {
  const v = fd.get(k)
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}
export const num = (fd: FormData, k: string): number | null => {
  const s = str(fd, k)
  return s == null ? null : parseNumero(s)
}
export const flag = (fd: FormData, k: string) => fd.get(k) === 'on' || fd.get(k) === 'true'

export function traducir(msg: string): string {
  if (/row-level security/i.test(msg)) return 'Tu rol no tiene permiso para hacer este cambio.'
  if (/duplicate key/i.test(msg)) return 'Ese registro ya existe.'
  if (/violates check constraint/i.test(msg)) return 'Algún valor está fuera del rango permitido.'
  if (/foreign key/i.test(msg)) return 'El registro referenciado no existe.'
  return msg
}

type Err = { message: string } | null

/** Ejecuta una escritura bajo RLS y refresca las rutas indicadas */
export async function escribir(
  fn: (sb: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: Err; count?: number | null }>,
  paths: string[] = [],
  ok = 'Guardado',
): Promise<Resultado> {
  const sb = await createClient()
  const { error } = await fn(sb)
  if (error) return { ok: false, error: traducir(error.message) }
  paths.forEach((p) => revalidatePath(p))
  return { ok: true, mensaje: ok }
}

/** Para updates: avisa si RLS dejó 0 filas afectadas (sin permiso) */
export async function actualizar(
  fn: (sb: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ error: Err; data: unknown[] | null }>,
  paths: string[] = [],
): Promise<Resultado> {
  const sb = await createClient()
  const { error, data } = await fn(sb)
  if (error) return { ok: false, error: traducir(error.message) }
  if (!data || data.length === 0) return { ok: false, error: 'Tu rol no tiene permiso para hacer este cambio.' }
  paths.forEach((p) => revalidatePath(p))
  return { ok: true, mensaje: 'Guardado' }
}
