'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Acceso con correo y contraseña (además de Google y enlace mágico).
// No abre el registro: una cuenta solo existe si el administrador invitó ese correo.
export async function entrarConContrasena(fd: FormData) {
  const email = String(fd.get('email') ?? '').trim().toLowerCase()
  const password = String(fd.get('password') ?? '')
  if (!email || !password) redirect('/login?error=credenciales')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=credenciales')
  redirect('/inicio')
}
