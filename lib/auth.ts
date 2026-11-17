import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { Usuario } from './types'

export async function getUsuario(): Promise<Usuario | null> {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  const { data } = await supabase.from('profiles').select('id,nombre,email,rol,activo').eq('id', auth.user.id).maybeSingle()
  if (!data || !data.activo) return null
  return { id: data.id, nombre: data.nombre, email: data.email, rol: data.rol }
}

export async function requireUsuario(): Promise<Usuario> {
  const u = await getUsuario()
  if (!u) redirect('/auth/signout')
  return u
}

export async function requireStaff(): Promise<Usuario> {
  const u = await requireUsuario()
  if (u.rol === 'consulta') redirect('/consulta')
  return u
}

export async function requireAdmin(): Promise<Usuario> {
  const u = await requireUsuario()
  if (u.rol !== 'admin') redirect(u.rol === 'consulta' ? '/consulta' : '/inicio')
  return u
}
