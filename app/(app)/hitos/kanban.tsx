'use client'
import { useMemo, useState, useTransition } from 'react'
import { DndContext, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { HitoCard } from '@/components/hitos/card'
import { cn } from '@/components/ui'
import { moverEtapa } from './actions'
import type { Eje, Etapa, Hito, Pais } from '@/lib/types'

function Tarjeta({ hito, ejes, movible }: { hito: Hito; ejes: Eje[]; movible: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: hito.id, disabled: !movible })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : undefined}
      className={cn('touch-pan-y', isDragging && 'opacity-80 shadow-glow')}>
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
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">{etapa.orden}. {etapa.nombre}</h2>
        <span className="chip">{n}</span>
      </header>
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }))

  const filtrados = useMemo(() => hitos.filter((h) =>
    (verTodos || h.estado === 'activo') &&
    (!pais || h.hito_paises?.some((p) => p.pais_codigo === pais)) && (!eje || h.eje_id === Number(eje))), [hitos, pais, eje, verTodos])

  const siguiente = (h: Hito) => {
    const vivas = (h.hito_etapas ?? []).filter((e) => e.estado !== 'omitida').map((e) => e.etapa_id).sort((a, b) => a - b)
    return vivas.find((id) => id > h.etapa_id)
  }

  function soltar(e: DragEndEvent) {
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
          <select id="f-pais" className="field w-44" value={pais} onChange={(e) => setPais(e.target.value)}>
            <option value="">Todos</option>{paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}</select></div>
        <div><label className="label" htmlFor="f-eje">Eje</label>
          <select id="f-eje" className="field w-44" value={eje} onChange={(e) => setEje(e.target.value)}>
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
      <DndContext sensors={sensors} onDragEnd={soltar}>
        <div className="-mx-4 hidden gap-4 overflow-x-auto px-4 pb-4 [contain:paint] md:flex md:-mx-8 md:px-8">
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
