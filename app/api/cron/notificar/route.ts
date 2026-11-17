import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enviarCorreo, plantillaCorreo } from '@/lib/correo'

// Tarea programada (Vercel Cron o pg_net): refresca semáforos y alertas, y envía por correo los avisos pendientes.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const sb = createAdminClient()
  const { error: e1 } = await sb.rpc('tareas_programadas')
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })

  const { data: pendientes } = await sb
    .from('notificaciones')
    .select('id,titulo,detalle,hito_id,profiles(email)')
    .is('correo_enviado_en', null)
    .order('creado_en')
    .limit(100)

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
  let enviados = 0
  for (const n of (pendientes ?? []) as unknown as { id: string; titulo: string; detalle: string | null; hito_id: string | null; profiles: { email: string } | null }[]) {
    const email = n.profiles?.email
    if (!email) continue
    const ok = await enviarCorreo(email, n.titulo, plantillaCorreo(n.titulo, n.detalle, n.hito_id ? `${base}/hitos/${n.hito_id}` : `${base}/notificaciones`))
    if (ok) {
      await sb.from('notificaciones').update({ correo_enviado_en: new Date().toISOString() }).eq('id', n.id)
      enviados++
    }
  }
  return NextResponse.json({ ok: true, correos: enviados, pendientes: pendientes?.length ?? 0 })
}
