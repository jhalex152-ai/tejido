import Link from 'next/link'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCatalogos } from '@/lib/data'
import { PageHeader, cn } from '@/components/ui'
import { PRIORIDAD_LABEL } from '@/lib/constants'
import { limitesTrimestre, trimestreActual } from '@/lib/fechas'

export default async function Paises({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff()
  const { q: qp } = await searchParams
  const q = qp && /^\d{4}-Q[1-4]$/.test(qp) ? qp : trimestreActual()
  const { ini, fin } = limitesTrimestre(q)
  const sb = await createClient()
  const cat = await getCatalogos()
  const { data } = await sb.from('hito_paises').select('pais_codigo,hitos!inner(id,nombre,fecha_inicio,fecha_fin,estado)')
  const filas = ((data ?? []) as unknown as { pais_codigo: string; hitos: { id: string; nombre: string; fecha_inicio: string; fecha_fin: string; estado: string } }[])
    .filter((f) => f.hitos.estado !== 'descartado' && f.hitos.fecha_inicio <= fin && f.hitos.fecha_fin >= ini)
  const por = (c: string) => filas.filter((f) => f.pais_codigo === c).map((f) => f.hitos)
  const prioritarios = cat.paises.filter((p) => ['alta', 'media_alta', 'media'].includes(p.prioridad))
  const sinHito = prioritarios.filter((p) => por(p.codigo).length === 0)
  const [y, n] = q.split('-Q').map(Number) as [number, number]
  const prev = n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}`, next = n === 4 ? `${y + 1}-Q1` : `${y}-Q${n + 1}`

  return (
    <>
      <PageHeader eyebrow="Presencia" title="22 países, un solo mapa de trabajo">
        <Link href={`/paises?q=${prev}`} className="btn-outline" aria-label="Trimestre anterior">←</Link>
        <span className="min-w-20 text-center font-semibold">{q.replace('-', ' ')}</span>
        <Link href={`/paises?q=${next}`} className="btn-outline" aria-label="Trimestre siguiente">→</Link>
      </PageHeader>
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="card-raised"><p className="eyebrow">Con presencia</p><p className="mt-1 text-3xl font-bold tracking-tight">{prioritarios.length - sinHito.length}<span className="text-lg font-normal text-ink-muted"> / {prioritarios.length}</span></p><p className="text-[13px] text-ink-muted">países de prioridad alta y media con al menos un hito</p></div>
        <div className={cn('card md:col-span-2', sinHito.length > 0 && 'border-sem-amber/50')}>
          <p className="eyebrow">Sin presencia este trimestre</p>
          {sinHito.length === 0 ? <p className="mt-2 text-sem-green">Todos los países prioritarios tienen al menos un hito.</p>
            : <p className="mt-2 text-[15px]"><span className="text-sem-amber">{sinHito.map((p) => p.nombre).join(', ')}</span>. El transversal recibe una alerta a 30 días del cierre del trimestre.</p>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-box border border-line">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-surface-raised"><tr><th className="th">País</th><th className="th">Marca</th><th className="th">Prioridad</th><th className="th">Estado</th><th className="th">Hitos del trimestre</th></tr></thead>
          <tbody className="divide-y divide-line">
            {cat.paises.sort((a, b) => ['alta', 'media_alta', 'media', 'media_baja', 'baja'].indexOf(a.prioridad) - ['alta', 'media_alta', 'media', 'media_baja', 'baja'].indexOf(b.prioridad) || a.nombre.localeCompare(b.nombre)).map((p) => {
              const hs = por(p.codigo); const alerta = hs.length === 0 && ['alta', 'media_alta', 'media'].includes(p.prioridad)
              return (
                <tr key={p.codigo} className={alerta ? 'bg-sem-amber/5' : ''}>
                  <td className="td font-medium">{p.nombre} <span className="text-[12px] text-ink-faint">{p.codigo} · {p.region}</span></td>
                  <td className="td"><span className="chip">{p.marca}</span></td>
                  <td className="td"><span className={p.prioridad === 'alta' ? 'chip-brand' : 'chip'}>{PRIORIDAD_LABEL[p.prioridad]}</span></td>
                  <td className="td text-ink-muted">{p.estado}</td>
                  <td className="td">{hs.length === 0 ? <span className={alerta ? 'text-sem-amber' : 'text-ink-faint'}>{alerta ? '⚠ Sin hitos' : '—'}</span>
                    : <ul className="space-y-0.5">{hs.map((h) => <li key={h.id}><Link href={`/hitos/${h.id}`} className="underline decoration-line-strong underline-offset-2 hover:decoration-brand">{h.nombre}</Link></li>)}</ul>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-ink-faint">La prioridad es la propuesta del brief y un administrador la edita en Admin → Países. El mapa SVG llega en la fase 2.</p>
    </>
  )
}
