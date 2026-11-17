'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/components/ui'
import { rangoFechas } from '@/lib/fechas'
import { NOMBRE_ETAPA, TIPO_LABEL } from '@/lib/constants'
import type { Semaforo, TipoHito } from '@/lib/types'

export interface ItemCal {
  id: string; nombre: string; tipo: TipoHito; ini: string; fin: string; porConfirmar: boolean
  paises: string[]; ciudad: string | null; venue: string | null; ejeId: number; eje: string; color: string
  estado: string; verticales: string[]; etapaId?: number; semaforo?: Semaforo; responsableId?: string | null
}
interface Props {
  items: ItemCal[]
  paises: { codigo: string; nombre: string; region: string }[]
  ejes: { id: number; nombre: string }[]
  verticales: string[]
  personas?: { id: string; nombre: string }[]
  conEtapa?: boolean
  enlazar: boolean
}

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const iso = (d: Date) => d.toISOString().slice(0, 10)
const utc = (s: string) => new Date(s + 'T00:00:00Z')
const addDias = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)
const lunesDe = (d: Date) => addDias(d, -((d.getUTCDay() + 6) % 7))

export function CalendarioView({ items, paises, ejes, verticales, personas = [], conEtapa = false, enlazar }: Props) {
  const hoy = new Date()
  const [vista, setVista] = useState<'mes' | 'semana' | 'lista'>('lista')
  const [ancla, setAncla] = useState(() => new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())))
  const [f, setF] = useState({ pais: '', region: '', eje: '', tipo: '', vertical: '', ciudad: '', etapa: '', responsable: '' })
  useEffect(() => { if (window.matchMedia('(min-width: 1024px)').matches) setVista('mes') }, [])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  const ciudades = useMemo(() => [...new Set(items.map((i) => i.ciudad).filter(Boolean) as string[])].sort(), [items])
  const regionDe = (c: string) => paises.find((p) => p.codigo === c)?.region
  const filtrados = useMemo(() => items.filter((i) =>
    (!f.pais || i.paises.includes(f.pais)) && (!f.region || i.paises.some((p) => regionDe(p) === f.region)) &&
    (!f.eje || i.ejeId === Number(f.eje)) && (!f.tipo || i.tipo === f.tipo) && (!f.vertical || i.verticales.includes(f.vertical)) &&
    (!f.ciudad || i.ciudad === f.ciudad) && (!f.etapa || String(i.etapaId) === f.etapa) && (!f.responsable || i.responsableId === f.responsable)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [items, f])

  const enDia = (d: string) => filtrados.filter((i) => i.ini <= d && i.fin >= d)
  const Evento = ({ i, mini = false }: { i: ItemCal; mini?: boolean }) => {
    const cuerpo = (
      <span className={cn('block truncate rounded-md border-l-[3px] bg-surface-muted px-2 py-1 text-left', mini ? 'text-[11px]' : 'text-[13px]', i.estado !== 'activo' && 'opacity-60')} style={{ borderLeftColor: i.color }}>
        {i.nombre}
      </span>
    )
    return enlazar ? <Link href={`/hitos/${i.id}`} className="block hover:brightness-125">{cuerpo}</Link> : cuerpo
  }

  const mes = ancla.getUTCMonth(), anio = ancla.getUTCFullYear()
  const primero = new Date(Date.UTC(anio, mes, 1))
  const inicioGrid = lunesDe(primero)
  const celdas = Array.from({ length: 42 }, (_, n) => addDias(inicioGrid, n))
  const semana = Array.from({ length: 7 }, (_, n) => addDias(lunesDe(ancla), n))

  const mover = (dir: number) => setAncla((a) => vista === 'semana' ? addDias(a, 7 * dir) : new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + dir, 1)))

  const porMes = useMemo(() => {
    const m = new Map<string, ItemCal[]>()
    ;[...filtrados].sort((a, b) => a.ini.localeCompare(b.ini)).forEach((i) => {
      const k = i.ini.slice(0, 7); m.set(k, [...(m.get(k) ?? []), i])
    })
    return [...m.entries()]
  }, [filtrados])

  const Sel = ({ k, label, children }: { k: keyof typeof f; label: string; children: React.ReactNode }) => (
    <div><label className="label" htmlFor={`cf-${k}`}>{label}</label>
      <select id={`cf-${k}`} value={f[k]} onChange={set(k)} className="field !min-h-[40px] !py-1 text-[13px]"><option value="">Todos</option>{children}</select></div>
  )

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Sel k="pais" label="País">{paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}</Sel>
        <Sel k="region" label="Región"><option>LATAM</option><option>Europa</option></Sel>
        <Sel k="eje" label="Eje">{ejes.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</Sel>
        <Sel k="tipo" label="Tipo">{Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Sel>
        <Sel k="vertical" label="Vertical">{verticales.map((v) => <option key={v}>{v}</option>)}</Sel>
        <Sel k="ciudad" label="Ciudad">{ciudades.map((c) => <option key={c}>{c}</option>)}</Sel>
        {conEtapa && <Sel k="etapa" label="Etapa">{Object.entries(NOMBRE_ETAPA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Sel>}
        {conEtapa && <Sel k="responsable" label="Responsable">{personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Sel>}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Vista" className="inline-flex rounded-full border border-line-strong p-1">
          {(['mes', 'semana', 'lista'] as const).map((v) => (
            <button key={v} role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
              className={cn('min-h-[40px] rounded-full px-4 text-[13px] font-medium capitalize', vista === v ? 'bg-brand-gradient text-bg' : 'text-ink-muted hover:text-ink')}>{v}</button>
          ))}
        </div>
        {vista !== 'lista' && (
          <div className="flex items-center gap-2">
            <button onClick={() => mover(-1)} aria-label="Anterior" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong hover:border-brand"><ChevronLeft size={18} /></button>
            <p className="min-w-40 text-center text-[15px] font-semibold capitalize">{vista === 'mes' ? `${MESES[mes]} ${anio}` : `${rangoFechas(iso(semana[0]!), iso(semana[6]!))} ${semana[6]!.getUTCFullYear()}`}</p>
            <button onClick={() => mover(1)} aria-label="Siguiente" className="grid h-11 w-11 place-items-center rounded-full border border-line-strong hover:border-brand"><ChevronRight size={18} /></button>
            <button onClick={() => setAncla(new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())))} className="btn-outline !min-h-[40px] px-4 text-[13px]">Hoy</button>
          </div>
        )}
      </div>

      <ul className="mb-4 flex flex-wrap gap-3 text-[12px] text-ink-muted" aria-label="Colores por eje">
        {ejes.map((e) => { const c = items.find((i) => i.ejeId === e.id)?.color; return c ? <li key={e.id} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />{e.nombre}</li> : null })}
      </ul>

      {vista === 'mes' && (
        <div className="overflow-hidden rounded-box border border-line">
          <div className="grid grid-cols-7 border-b border-line bg-surface-raised">{DIAS.map((d) => <p key={d} className="px-2 py-2 text-center text-[12px] uppercase tracking-wider text-ink-muted">{d}</p>)}</div>
          <div className="grid grid-cols-7">
            {celdas.map((d) => {
              const k = iso(d), ev = enDia(k), fuera = d.getUTCMonth() !== mes, esHoy = k === iso(new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())))
              return (
                <div key={k} className={cn('min-h-[104px] space-y-1 border-b border-r border-line p-1.5', fuera && 'bg-bg-deep/60')}>
                  <p className={cn('mb-1 text-[12px]', fuera ? 'text-ink-off' : 'text-ink-muted', esHoy && 'inline-grid h-6 w-6 place-items-center rounded-full bg-brand font-bold text-bg')}>{d.getUTCDate()}</p>
                  {ev.slice(0, 3).map((i) => <Evento key={i.id} i={i} mini />)}
                  {ev.length > 3 && <p className="px-1 text-[11px] text-ink-muted">+{ev.length - 3} más</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {vista === 'semana' && (
        <div className="grid gap-3 md:grid-cols-7">
          {semana.map((d, n) => { const ev = enDia(iso(d)); return (
            <div key={iso(d)} className="min-h-[120px] rounded-box border border-line p-2">
              <p className="mb-2 text-[12px] uppercase tracking-wider text-ink-muted">{DIAS[n]} {d.getUTCDate()}</p>
              <div className="space-y-1.5">{ev.map((i) => <Evento key={i.id} i={i} />)}{ev.length === 0 && <p className="text-[12px] text-ink-off">—</p>}</div>
            </div>) })}
        </div>
      )}

      {vista === 'lista' && (
        <div className="space-y-6">
          {porMes.length === 0 && <p className="rounded-box border border-dashed border-line-strong p-8 text-center text-ink-muted">No hay hitos con esos filtros.</p>}
          {porMes.map(([k, arr]) => (
            <section key={k}>
              <h2 className="eyebrow mb-2 capitalize">{MESES[Number(k.slice(5)) - 1]} {k.slice(0, 4)}</h2>
              <ul className="space-y-2">
                {arr.map((i) => {
                  const cuerpo = (
                    <div className="flex items-start gap-3 rounded-box border border-line bg-surface p-3.5" style={{ borderLeft: `4px solid ${i.color}` }}>
                      <div className="w-24 shrink-0 text-[13px] font-semibold text-brand-light">{rangoFechas(i.ini, i.fin)}{i.porConfirmar && <span className="block text-[11px] font-normal text-ink-muted">por confirmar</span>}</div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{i.nombre}</p>
                        <p className="text-[13px] text-ink-muted">{[i.paises.join(', '), i.ciudad, i.venue].filter(Boolean).join(' · ')} · {i.eje}</p>
                        {i.verticales.length > 0 && <p className="mt-1 flex flex-wrap gap-1">{i.verticales.map((v) => <span key={v} className="chip">{v}</span>)}</p>}
                      </div>
                      <div className="text-right text-[12px] text-ink-muted">{i.etapaId != null ? NOMBRE_ETAPA[i.etapaId] : i.estado !== 'activo' ? i.estado.replace('_', ' ') : ''}</div>
                    </div>
                  )
                  return <li key={i.id}>{enlazar ? <Link href={`/hitos/${i.id}`} className="block hover:brightness-110">{cuerpo}</Link> : cuerpo}</li>
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
