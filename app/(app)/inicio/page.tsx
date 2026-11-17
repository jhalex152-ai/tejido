import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCatalogos, listarHitos } from '@/lib/data'
import { HitoCard } from '@/components/hitos/card'
import { Empty, PageHeader, SemaforoDot } from '@/components/ui'
import { ROL_LABEL } from '@/lib/constants'
import { diasHasta } from '@/lib/fechas'

export default async function Inicio() {
  const u = await requireStaff()
  const sb = await createClient()
  const [hitos, cat, { data: asig }, { data: notifs }] = await Promise.all([
    listarHitos(), getCatalogos(),
    sb.from('hito_asignaciones').select('hito_id').eq('user_id', u.id),
    sb.from('notificaciones').select('id,titulo,detalle,hito_id,creado_en').eq('leida', false).order('creado_en', { ascending: false }).limit(5),
  ])
  const mios = new Set((asig ?? []).map((a) => a.hito_id))
  const activos = hitos.filter((h) => h.estado === 'activo')
  const etapaDe = (id: number) => cat.etapas.find((e) => e.id === id)!

  // "Lo que me toca": hitos cuya etapa actual es de mi movilizador, o que tengo asignados.
  // El administrador ve lo que está en riesgo (compuertas vencidas).
  const toca = activos.filter((h) => u.rol === 'admin' ? h.semaforo !== 'verde' : etapaDe(h.etapa_id).rol_dueno === u.rol || mios.has(h.id))
  const faltantes = await Promise.all(toca.slice(0, 8).map(async (h) => {
    const { data } = await sb.rpc('faltantes_compuerta', { p_hito: h.id })
    return [h.id, (data ?? []) as string[]] as const
  }))
  const falta = new Map(faltantes)
  const proximos = activos.filter((h) => { const d = diasHasta(h.fecha_inicio); return d >= 0 && d <= 30 })
  const alertas = activos.filter((h) => h.semaforo !== 'verde')

  return (
    <>
      <PageHeader eyebrow={ROL_LABEL[u.rol]} title={`Hola, ${u.nombre.split(' ')[0]}`} />

      {alertas.length > 0 && (
        <section aria-labelledby="alertas" className="mb-8">
          <h2 id="alertas" className="mb-3 flex items-center gap-2 text-lg"><AlertTriangle size={18} className="text-sem-amber" />Alertas ({alertas.length})</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {alertas.slice(0, 6).map((h) => (
              <li key={h.id}><Link href={`/hitos/${h.id}`} className="flex items-center justify-between gap-3 rounded-box border border-line bg-surface p-3.5 hover:border-brand">
                <span><b className="font-semibold">{h.nombre}</b><span className="block text-[13px] text-ink-muted">{h.semaforo === 'rojo' ? 'Compuerta vencida y faltan menos de 7 días' : 'Compuerta vencida'} · {etapaDe(h.etapa_id).nombre}</span></span>
                <SemaforoDot valor={h.semaforo} />
              </Link></li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="toca" className="mb-8">
        <h2 id="toca" className="mb-3 text-lg">Lo que me toca</h2>
        {toca.length === 0 ? (
          <Empty title="Nada pendiente por ahora. Cuando una compuerta pase a tu movilizador, aparecerá aquí." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {toca.map((h) => {
              const f = falta.get(h.id)
              return (
                <li key={h.id} className="space-y-2">
                  <HitoCard hito={h} ejes={cat.ejes} />
                  {f && <p className="px-2 text-[13px] text-ink-muted">{f.length === 0 ? '✓ La compuerta está lista para aprobar' : `${f.length === 1 ? '1 pendiente' : `${f.length} pendientes`}: ${f[0]}${f.length > 1 ? ` y ${f.length - 1} más` : ''}`}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="prox" className="mb-8">
        <div className="mb-3 flex items-center justify-between"><h2 id="prox" className="text-lg">Próximos 30 días</h2><Link href="/calendario" className="flex items-center gap-1 text-[13px] text-brand-light">Ver calendario <ArrowRight size={14} /></Link></div>
        {proximos.length === 0 ? <Empty title="No hay hitos en los próximos 30 días." action={<Link href="/hitos/nuevo" className="btn-outline">Agregar un hito</Link>} />
          : <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{proximos.map((h) => <li key={h.id}><HitoCard hito={h} ejes={cat.ejes} /></li>)}</ul>}
      </section>

      {(notifs ?? []).length > 0 && (
        <section aria-labelledby="av">
          <div className="mb-3 flex items-center justify-between"><h2 id="av" className="text-lg">Avisos sin leer</h2><Link href="/notificaciones" className="text-[13px] text-brand-light">Ver todos</Link></div>
          <ul className="space-y-2">{notifs!.map((n) => (
            <li key={n.id}><Link href={n.hito_id ? `/hitos/${n.hito_id}` : '/notificaciones'} className="block rounded-box border border-line bg-surface p-3.5 hover:border-brand"><p className="text-[14px] font-medium">{n.titulo}</p>{n.detalle && <p className="text-[13px] text-ink-muted">{n.detalle}</p>}</Link></li>))}</ul>
        </section>
      )}
    </>
  )
}
