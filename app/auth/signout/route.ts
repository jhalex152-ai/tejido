import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function salir(request: NextRequest, error?: string) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const url = new URL('/login', request.url)
  if (error) url.searchParams.set('error', error)
  return NextResponse.redirect(url, { status: 303 })
}
// GET: sesión sin perfil activo (no invitado o desactivado). POST: botón "Salir".
export const GET = (r: NextRequest) => salir(r, 'sin_acceso')
export const POST = (r: NextRequest) => salir(r)
