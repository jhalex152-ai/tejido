import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCatalogos } from '@/lib/data'
import { PageHeader, cn } from '@/components/ui'
import { EmbudoChart } from '@/components/charts/embudo'
import { verTablero } from '@/lib/permisos'
import { limitesTrimestre, trimestreActual } from '@/lib/fechas'
import { convertir, costoPorLead, cumplimientoMeta, fmtMoneda, fmtNum, fmtPct, semaforoMeta, tasaCalificacion, tasaCaptura, activacion } from '@/lib/kpis'
import type { HitoEtapa, HitoVertical, ResultadoLeads, TipoHito } from '@/lib/types'

const SEM = { verde: 'text-sem-green', ambar: 'text-sem-amber', rojo: 'text-sem-red' } as const
const SEMBG = { verde: 'bg-sem-green', ambar: 'bg-sem-amber', rojo: 'bg-sem-red' } as const

interface HitoT { id: string; nombre: string; tipo: TipoHito; eje_id: number; fecha_inicio: string; fecha_fin: string; estado: string; moneda: string; asistentes_reales: number | null
  hito_etapas: HitoEtapa[]; hito_paises: { pais_codigo: string }[] }

function Tile({ k, v, nota, color }: { k: string; v: string; nota?: string; color?: keyof typeof SEM | null }) {
  return (
    <div className="card-raised">
      <p className="eyebrow">{k}</p>
      <p className={cn('mt-1 text-3xl font-bold tracking-tight', color && SEM[color])}>{v}</p>
      {nota && <p className="mt-1 text-[12px] text-ink-muted">{nota}</p>}
    </div>
  )
}

export default async function Tablero({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const u = await requireStaff()
  if (!verTablero(u.rol)) redirect('/inicio')
  const { q: qp } = await searchParams
  const q = qp && /^\d{4}-Q[1-4]$/.test(qp) ? qp : trimestreActual()
  const { ini, fin } = limitesTrimestre(q)
  const sb = await createClient()
  const cat = await getCatalogos()

  const { data: h } = await sb.from('hitos').select('id,nombre,tipo,eje_id,fecha_inicio,fecha_fin,estado,moneda,asistentes_reales,hito_etapas(etapa_id,estado,forzada),hito_paises(pais_codigo)')
    .lte('fecha_inicio', fin).gte('fecha_fin', ini).neq('estado', 'descartado')
  const hitos = (h ?? []) as unknown as HitoT[]
  const ids = hitos.map((x) => x.id)
  const [{ data: hv }, { data: rl }, { data: pr }, { data: pub }, { data: pl }, { data: metas }, { data: soc }] = await Promise.all([
    sb.from('hito_verticales').select('*').in('hito_id', ids).neq('rol', 'no_va'),
    sb.from('resultados_leads').select('*').in('hito_id', ids),
    sb.from('presupuestos').select('hito_id,costo_real').in('hito_id', ids),
    sb.from('publicaciones').select('hito_id,tipo,fecha,competidores').in('hito_id', ids).order('fecha'),
    sb.from('planes_captura').select('hito_id,vertical_id,aprobado').in('hito_id', ids),
    sb.from('kpi_metas').select('*').eq('trimestre', q),
    sb.from('acciones_sociales').select('hito_id,aliado_id,beneficiarios').in('hito_id', ids),
  ])
  const matriz = (hv ?? []) as HitoVertical[]
  const resultados = (rl ?? []) as ResultadoLeads[]
  const costoDe = new Map((pr ?? []).map((p) => [p.hito_id, p.costo_real as number | null]))
  const tasas = Object.fromEntries(cat.monedas.map((m) => [m.codigo, { cop: Number(m.cop_por_unidad), usd: Number(m.usd_por_unidad) }]))

  // Por vertical: meta, calificados, tasas y costo por lead calificado (costo real repartido por participación)
  const verticales = cat.verticales.map((v) => {
    const filas = matriz.filter((m) => m.vertical_id === v.id)
    if (filas.length === 0) return null
    let aud = 0, meta = 0, cap = 0, cal = 0, reg = 0, act = 0, costo = 0, conCosto = false
    for (const m of filas) {
      aud += m.audiencia_objetivo ?? 0; meta += m.meta_leads ?? 0
      const r = resultados.find((x) => x.hito_id === m.hito_id && x.vertical_id === v.id)
      if (!r) continue
      cap += r.capturados; cal += r.calif_a + r.calif_b; reg += r.registros; act += r.activados_30d
      const hito = hitos.find((x) => x.id === m.hito_id)
      const real = costoDe.get(m.hito_id)
      if (hito && real != null) {
        const n = matriz.filter((x) => x.hito_id === m.hito_id).length
        const copReal = convertir(Number(real), hito.moneda, 'COP', tasas)
        if (copReal != null) { costo += copReal * (m.participacion_costo ?? 1 / n); conCosto = true }
      }
    }
    const emb = { audienciaObjetivo: aud || null, metaLeads: meta || null, capturados: cap, calificados: cal, registros: reg, activados: act }
    return { v, emb, meta, cpl: conCosto && cal > 0 ? costo / cal : null, cumpl: cumplimientoMeta(emb) }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  const metaTotal = verticales.reduce((a, x) => a + x.meta, 0)
  const calTotal = verticales.reduce((a, x) => a + x.emb.calificados, 0)
  const cumplTotal = metaTotal > 0 ? calTotal / metaTotal : null
  const semGlobal = semaforoMeta(cumplTotal, cat.umbrales)
  const costoTotalCOP = verticales.reduce((a, x) => a + (x.cpl ?? 0) * x.emb.calificados, 0)

  // KPIs del producto
  const cerrados = hitos.filter((x) => x.estado === 'cerrado')
  const cuatro = (x: HitoT) => [2, 3, 4, 5, 6].every((id) => { const e = x.hito_etapas.find((y) => y.etapa_id === id); return !e || e.estado === 'omitida' || (e.estado === 'aprobada' && !(e as HitoEtapa).forzada) })
  const conCuatro = cerrados.filter(cuatro).length
  const terminados = hitos.filter((x) => x.fecha_fin < new Date().toISOString().slice(0, 10))
  const en48 = terminados.filter((x) => { const p = (pub ?? []).find((y) => y.hito_id === x.id); return p && new Date(p.fecha).getTime() <= new Date(`${x.fecha_fin}T00:00:00-05:00`).getTime() + 3 * 86400000 })
  const eventosConVertical = hitos.filter((x) => matriz.some((m) => m.hito_id === x.id))
  const planCompleto = eventosConVertical.filter((x) => matriz.filter((m) => m.hito_id === x.id).every((m) => (pl ?? []).some((p) => p.hito_id === x.id && p.vertical_id === m.vertical_id && p.aprobado)))
  const narrativaOk = hitos.filter((x) => x.hito_etapas.find((e) => e.etapa_id === 3)?.estado === 'aprobada')
  const ganadas = (pub ?? []).filter((p) => p.tipo === 'ganado').length
  const comp = new Map<string, number>()
  ;(pub ?? []).forEach((p) => (p.competidores ?? []).forEach((c: string) => comp.set(c, (comp.get(c) ?? 0) + 1)))

  const porEje = cat.ejes.map((e) => ({ e, n: hitos.filter((x) => x.eje_id === e.id).length }))
  const activaciones = resultados.filter((r) => hitos.find((x) => x.id === r.hito_id)?.eje_id === 1).reduce((a, r) => a + r.activados_30d, 0)
  const rankings = hitos.filter((x) => x.tipo === 'ranking_premio').length
  const gremios = hitos.filter((x) => x.tipo === 'gremio_gobierno').length
  const alianzas = (soc ?? []).filter((s) => s.aliado_id).length
  const beneficiarios = (soc ?? []).reduce((a, s) => a + (s.beneficiarios ?? 0), 0)
  const porPais = cat.paises.map((p) => ({ p, n: hitos.filter((x) => x.hito_paises.some((y) => y.pais_codigo === p.codigo)).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)

  const [y, n] = q.split('-Q').map(Number) as [number, number]
  const prev = n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}`, next = n === 4 ? `${y + 1}-Q1` : `${y}-Q${n + 1}`

  return (
    <>
      <PageHeader eyebrow="Tablero del área" title="Leads reales, no aforo">
        <Link href={`/tablero?q=${prev}`} className="btn-outline" aria-label="Trimestre anterior">←</Link>
        <span className="min-w-20 text-center font-semibold">{q.replace('-', ' ')}</span>
        <Link href={`/tablero?q=${next}`} className="btn-outline" aria-label="Trimestre siguiente">→</Link>
      </PageHeader>

      <section className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <div className="card-raised col-span-2 xl:col-span-1">
          <p className="eyebrow">Semáforo trimestral</p>
          <div className="mt-2 flex items-center gap-3"><span className={cn('h-5 w-5 rounded-full', semGlobal ? SEMBG[semGlobal] : 'bg-ink-off')} /><p className={cn('text-3xl font-bold tracking-tight', semGlobal && SEM[semGlobal])}>{fmtPct(cumplTotal)}</p></div>
          <p className="mt-1 text-[12px] text-ink-muted">de la meta de leads calificados · verde ≥ {cat.umbrales.verde}%, ámbar ≥ {cat.umbrales.ambar}%</p>
        </div>
        <Tile k="Leads calificados" v={fmtNum(calTotal)} nota={`meta ${fmtNum(metaTotal)}`} />
        <Tile k="Costo / lead calificado" v={calTotal > 0 && costoTotalCOP > 0 ? fmtMoneda(costoTotalCOP / calTotal, 'COP') : '—'} nota="costo real repartido por vertical" />
        <Tile k="Hitos del trimestre" v={String(hitos.length)} nota={`${cerrados.length} cerrados`} />
        <Tile k="Amplificación ≤ 48 h" v={terminados.length ? fmtPct(en48.length / terminados.length) : '—'} nota={`meta ≥ 90% · ${en48.length}/${terminados.length} eventos terminados`} />
      </section>

      <section className="mb-8 grid gap-6 2xl:grid-cols-2">
        <div className="card">
          <h2 className="mb-1 text-lg">Embudo por vertical</h2>
          <p className="mb-3 text-[13px] text-ink-muted">Capturados → calificados (A+B) → registros en Dropi → activos a 30 días.</p>
          <EmbudoChart data={verticales.filter((x) => x.emb.capturados > 0).map((x) => ({ vertical: x.v.nombre, Capturados: x.emb.capturados, Calificados: x.emb.calificados, Registros: x.emb.registros, 'Activos a 30 d': x.emb.activados }))} />
        </div>
        <div className="card overflow-x-auto">
          <h2 className="mb-3 text-lg">Cumplimiento por vertical</h2>
          <table className="w-full min-w-[520px] text-left">
            <thead><tr><th className="th">Vertical</th><th className="th">Meta</th><th className="th">Calif.</th><th className="th">Meta %</th><th className="th">Captura</th><th className="th">Calificación</th><th className="th">Activación</th><th className="th">Costo/lead</th></tr></thead>
            <tbody className="divide-y divide-line">
              {verticales.map(({ v, emb, meta, cpl, cumpl }) => {
                const s = semaforoMeta(cumpl, cat.umbrales)
                return (<tr key={v.id}><td className="td font-medium">{v.nombre}</td><td className="td">{fmtNum(meta)}</td><td className="td">{fmtNum(emb.calificados)}</td>
                  <td className={cn('td font-semibold', s && SEM[s])}>{fmtPct(cumpl)}</td><td className="td">{fmtPct(tasaCaptura(emb))}</td><td className="td">{fmtPct(tasaCalificacion(emb))}</td><td className="td">{fmtPct(activacion(emb))}</td><td className="td">{cpl != null ? fmtMoneda(cpl, 'COP') : '—'}</td></tr>)
              })}
              {verticales.length === 0 && <tr><td colSpan={8} className="td text-ink-muted">Aún no hay verticales presentes en los hitos de este trimestre.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <h2 className="mb-3 text-lg">KPIs por movilizador</h2>
      <section className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile k="1 · Datos" v={String(hitos.filter((x) => x.hito_etapas.find((e) => e.etapa_id === 2)?.estado === 'aprobada').length)} nota="hitos con cifra validada para vocería" />
        <Tile k="2 · Narrativa" v={hitos.length ? fmtPct(narrativaOk.length / hitos.length) : '—'} nota="hitos con mensaje y vocero aprobados" />
        <Tile k="3 · Eventos" v={eventosConVertical.length ? fmtPct(planCompleto.length / eventosConVertical.length) : '—'} nota={`eventos con plan de captura completo · ${fmtPct(cumplTotal)} de la meta de leads`} />
        <Tile k="4 · Medios" v={String(ganadas)} nota={`menciones ganadas${comp.size ? ' · competidores citados: ' + [...comp.entries()].map(([k, c]) => `${k} ${c}`).join(', ') : ''}`} />
      </section>
      <section className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile k="Hitos con las 4 compuertas" v={cerrados.length ? fmtPct(conCuatro / cerrados.length) : '—'} nota="meta 100% de los hitos cerrados" />
        <Tile k="Activaciones desde eventos" v={fmtNum(activaciones)} nota="eje e-commerce, a 30 días" />
        <Tile k="Rankings y mesas" v={`${rankings} · ${gremios}`} nota="rankings logrados · mesas de gremios y gobierno" />
        <Tile k="Social" v={`${alianzas} · ${fmtNum(beneficiarios)}`} nota="alianzas RSE · beneficiarios" />
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-2">
        <div className="card"><h2 className="mb-3 text-lg">Hitos por eje</h2>
          <ul className="space-y-2">{porEje.map(({ e, n: c }) => (
            <li key={e.id} className="flex items-center gap-3 text-[14px]"><span className="w-40 shrink-0">{e.nombre}</span>
              <span className="h-2.5 rounded-full" style={{ width: `${Math.max(c * 14, c ? 14 : 0)}px`, background: e.color }} /><b>{c}</b></li>))}</ul></div>
        <div className="card"><h2 className="mb-3 text-lg">Hitos por país</h2>
          {porPais.length === 0 ? <p className="text-ink-muted">Sin hitos en el trimestre.</p> : <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[14px]">{porPais.map(({ p, n: c }) => <li key={p.codigo} className="flex justify-between"><span>{p.nombre}</span><b>{c}</b></li>)}</ul>}
          <Link href={`/paises?q=${q}`} className="mt-3 inline-block text-[13px] text-brand-light underline">Ver presencia frente a la prioridad</Link></div>
      </section>

      {(metas ?? []).length > 0 && (
        <section className="card mb-8"><h2 className="mb-3 text-lg">Metas del trimestre {q}</h2>
          <ul className="grid gap-2 md:grid-cols-2">{metas!.map((m) => <li key={m.id} className="flex justify-between rounded-field border border-line px-3 py-2 text-[14px]"><span className="text-ink-muted">{m.nivel} · {m.clave}</span><b>{fmtNum(m.meta)}</b></li>)}</ul></section>
      )}
      <p className="text-[12px] text-ink-faint">Costos convertidos con las tasas de Admin → Monedas (referenciales). Las verticales sin resultados cargados no entran en las tasas.</p>
    </>
  )
}
