'use client'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DndContext, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { HitoCard } from '@/components/hitos/card'
import { cn } from '@/components/ui'
import { moverEtapa } from './actions'
import type { Eje, Etapa, Hito, Pais } from '@/lib/types'

function Tarjeta({ hito, ejes, movible }: { hito: Hito; ejes: Eje[]; movible: boolean }) {
  const { listeners, setNodeRef, transform, isDragging } = useDraggable({ id: hito.id, disabled: !movible })
  return (
    <div ref={setNodeRef} {...listeners}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined}
      className={cn('touch-pan-y', movible && '[&_a]:cursor-grab active:[&_a]:cursor-grabbing', isDragging && 'opacity-80 shadow-glow')}>
      <HitoCard hito={hito} ejes={ejes} compacto />
    </div>
  )
}

function Columna({ etapa, children, n, objetivo }: { etapa: Etapa; children: React.ReactNode; n: number; objetivo: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: String(etapa.id) })
  return (
    <section ref={setNodeRef} aria-label={etapa.nombre}
      className={cn('w-72 shrink-0 rounded-box border bg-surface-raised p-3 transition',
        isOver && objetivo ? 'border-brand shadow-glow' : 'border-line', isOver && !objetivo && 'border-sem-red/60')}>
      <h2 className="sr-only">{etapa.orden}. {etapa.nombre}: {n} hitos</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function Kanban({ hitos, etapas, ejes, paises, puedeMover }: { hitos: Hito[]; etapas: Etapa[]; ejes: Eje[]; paises: Pais[]; puedeMover: boolean }) {
  const [pais, setPais] = useState('')
  const [eje, setEje] = useState('')
  const [verTodos, setVerTodos] = useState(false)
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string; faltantes?: string[] } | null>(null)
  const [etapaMovil, setEtapaMovil] = useState(0)
  const [, start] = useTransition()
  const tablero = useRef<HTMLDivElement>(null)
  const titulos = useRef<HTMLDivElement>(null)
  // La fila de títulos sigue el desplazamiento lateral del tablero (asignación directa: sin estado ni re-renderizados)
  const sincronizar = () => { if (titulos.current && tablero.current) titulos.current.scrollLeft = tablero.current.scrollLeft }
  const mover = (dir: 1 | -1) => tablero.current?.scrollBy({ left: dir * 304, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  // Tras arrastrar, el navegador dispara un clic sobre la tarjeta: se bloquea para que no abra el detalle
  const arrastrando = useRef(false)
  const finArrastre = () => { setTimeout(() => { arrastrando.current = false }, 250) }

  // Teclado: ← → desplazan el tablero una columna; ↑ ↓ desplazan la página. No interfiere al escribir ni en los filtros.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const t = e.target as HTMLElement | null
      if (t?.closest('input:not([type=checkbox]):not([type=radio]), select, textarea, [contenteditable=true], [role=listbox], [role=menu], dialog')) return
      const el = tablero.current
      const suave = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && el && el.offsetParent !== null) {
        e.preventDefault()
        el.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * 304, behavior: suave })
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        window.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * 160, behavior: suave })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }))

  const filtrados = useMemo(() => hitos.filter((h) =>
    (verTodos || h.estado === 'activo') &&
    (!pais || h.hito_paises?.some((p) => p.pais_codigo === pais)) && (!eje || h.eje_id === Number(eje))), [hitos, pais, eje, verTodos])

  const siguiente = (h: Hito) => {
    const vivas = (h.hito_etapas ?? []).filter((e) => e.estado !== 'omitida').map((e) => e.etapa_id).sort((a, b) => a - b)
    return vivas.find((id) => id > h.etapa_id)
  }

  function soltar(e: DragEndEvent) {
    finArrastre()
    if (!e.over) return
    const h = hitos.find((x) => x.id === e.active.id)
    const destino = Number(e.over.id)
    if (!h || destino === h.etapa_id) return
    if (h.estado !== 'activo') return setAviso({ ok: false, texto: `El hito está ${h.estado === 'en_pausa' ? 'en pausa' : h.estado}: reactívalo antes de avanzar.` })
    if (destino !== siguiente(h)) return setAviso({ ok: false, texto: 'Las compuertas se aprueban en orden: solo puedes mover un hito a su siguiente etapa.' })
    start(async () => {
      const r = await moverEtapa(h.id)
      setAviso(r.ok ? { ok: true, texto: `${h.nombre}: ${r.mensaje}` } : { ok: false, texto: `${h.nombre}: ${r.error}`, faltantes: r.faltantes })
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="f-pais">País</label>
          <select id="f-pais" className="field w-44" value={pais} onChange={(e) => { setPais(e.target.value); e.currentTarget.blur() }}>
            <option value="">Todos</option>{paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}</select></div>
        <div><label className="label" htmlFor="f-eje">Eje</label>
          <select id="f-eje" className="field w-44" value={eje} onChange={(e) => { setEje(e.target.value); e.currentTarget.blur() }}>
            <option value="">Todos</option>{ejes.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></div>
        <label className="flex min-h-[44px] items-center gap-2 text-[14px] text-ink-soft">
          <input type="checkbox" className="h-5 w-5 accent-[#FF6F20]" checked={verTodos} onChange={(e) => setVerTodos(e.target.checked)} />
          Incluir pausados y cerrados
        </label>
      </div>

      {aviso && (
        <div role={aviso.ok ? 'status' : 'alert'} className={cn('mb-4 rounded-box border p-3 text-[14px]', aviso.ok ? 'border-sem-green/40 bg-sem-green/10 text-sem-green' : 'border-sem-red/40 bg-sem-red/10 text-sem-red')}>
          <div className="flex justify-between gap-3"><p>{aviso.texto}</p><button onClick={() => setAviso(null)} className="text-ink-muted underline">cerrar</button></div>
          {aviso.faltantes && <ul className="mt-1.5 list-disc pl-5 text-ink-soft">{aviso.faltantes.map((f) => <li key={f}>{f}</li>)}</ul>}
        </div>
      )}

      {/* Escritorio: una columna por etapa */}
      <DndContext sensors={sensors} onDragStart={() => { arrastrando.current = true }} onDragEnd={soltar} onDragCancel={finArrastre}>
        {/* Títulos de etapa: se quedan fijos bajo la barra superior al bajar, y acompañan el desplazamiento lateral */}
        <div className="sticky top-[61px] z-10 -mx-4 hidden border-b border-line bg-bg/95 py-2 backdrop-blur md:-mx-8 md:block">
          <div ref={titulos} aria-hidden className="flex gap-4 overflow-hidden px-4 md:px-8">
            {etapas.map((et) => (
              <div key={et.id} className="flex w-72 shrink-0 items-center justify-between rounded-box border border-line bg-surface-raised px-4 py-2.5">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">{et.orden}. {et.nombre}</span>
                <span className="chip">{filtrados.filter((h) => h.etapa_id === et.id).length}</span>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1.5 bg-gradient-to-l from-bg via-bg/95 to-transparent pl-12 pr-3 md:pr-7">
            <button type="button" onClick={() => mover(-1)} aria-label="Columnas anteriores" className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-bg/90 text-ink-soft shadow-lg hover:border-brand hover:text-ink"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => mover(1)} aria-label="Columnas siguientes" className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-bg/90 text-ink-soft shadow-lg hover:border-brand hover:text-ink"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div ref={tablero} onScroll={sincronizar} onClickCapture={(e) => { if (arrastrando.current) { e.preventDefault(); e.stopPropagation() } }} className="-mx-4 hidden gap-4 overflow-x-auto px-4 pb-4 pt-3 [contain:paint] md:flex md:-mx-8 md:px-8">
          {etapas.map((et) => {
            const items = filtrados.filter((h) => h.etapa_id === et.id)
            return (
              <Columna key={et.id} etapa={et} n={items.length} objetivo>
                {items.length === 0 && <p className="rounded-field border border-dashed border-line p-3 text-center text-[12px] text-ink-faint">Sin hitos</p>}
                {items.map((h) => <Tarjeta key={h.id} hito={h} ejes={ejes} movible={puedeMover} />)}
              </Columna>
            )
          })}
        </div>
      </DndContext>

      {/* Móvil: una columna con selector de etapa */}
      <div className="md:hidden">
        <label className="label" htmlFor="etapa-movil">Etapa</label>
        <select id="etapa-movil" className="field mb-4" value={etapaMovil} onChange={(e) => setEtapaMovil(Number(e.target.value))}>
          {etapas.map((et) => <option key={et.id} value={et.id}>{et.orden}. {et.nombre} ({filtrados.filter((h) => h.etapa_id === et.id).length})</option>)}
        </select>
        <div className="space-y-3">
          {filtrados.filter((h) => h.etapa_id === etapaMovil).map((h) => <HitoCard key={h.id} hito={h} ejes={ejes} />)}
          {filtrados.filter((h) => h.etapa_id === etapaMovil).length === 0 && <p className="rounded-box border border-dashed border-line-strong p-6 text-center text-ink-muted">No hay hitos en esta etapa.</p>}
        </div>
      </div>
    </div>
  )
}
