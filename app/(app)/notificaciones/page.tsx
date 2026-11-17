import Link from 'next/link'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Empty, PageHeader, cn } from '@/components/ui'
import { marcarLeidas } from './actions'

export default async function Notificaciones() {
  await requireStaff()
  const sb = await createClient()
  const { data } = await sb.from('notificaciones').select('*').order('creado_en', { ascending: false }).limit(100)
  const sinLeer = (data ?? []).filter((n) => !n.leida).length
  return (
    <>
      <PageHeader eyebrow="Avisos" title="Notificaciones">
        {sinLeer > 0 && <form action={async () => { 'use server'; await marcarLeidas() }}><button className="btn-outline">Marcar todas como leídas</button></form>}
      </PageHeader>
      {(data ?? []).length === 0 ? <Empty title="Sin avisos. Te llegará uno cuando una compuerta te toque, se venza o esté lista para aprobar." /> : (
        <ul className="max-w-3xl space-y-2">
          {data!.map((n) => (
            <li key={n.id} className={cn('flex items-start justify-between gap-3 rounded-box border p-4', n.leida ? 'border-line bg-surface' : 'border-brand/50 bg-[rgba(255,111,32,0.06)]')}>
              <div>
                <p className="text-[14px] font-medium">{n.titulo}</p>
                {n.detalle && <p className="text-[13px] text-ink-muted">{n.detalle}</p>}
                <p className="mt-1 text-[12px] text-ink-faint">{new Date(n.creado_en).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' })}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {n.hito_id && <Link href={`/hitos/${n.hito_id}`} className="text-[13px] text-brand-light underline">Abrir</Link>}
                {!n.leida && <form action={async () => { 'use server'; await marcarLeidas(n.id) }}><button className="text-[12px] text-ink-muted underline">Marcar leída</button></form>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
