import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { EjeChip, ICONOS, SemaforoDot, cn } from '@/components/ui'
import { rangoFechas } from '@/lib/fechas'
import { puntosProgreso } from '@/lib/progreso'
import { NOMBRE_ETAPA } from '@/lib/constants'
import type { Eje, Hito } from '@/lib/types'

export function Progreso({ hito }: { hito: Pick<Hito, 'hito_etapas'> }) {
  return (
    <ul className="flex items-center gap-1.5" aria-label="Progreso de los 4 movilizadores">
      {puntosProgreso(hito.hito_etapas).map((p) => {
        const Icon = ICONOS[p.icono]!
        return (
          <li key={p.id} title={`${p.nombre}: ${p.estado}`}
            className={cn('grid h-7 w-7 place-items-center rounded-full border text-[10px]',
              p.estado === 'hecho' && 'border-transparent bg-brand-gradient text-bg',
              p.estado === 'actual' && 'border-brand text-brand-light shadow-glow',
              p.estado === 'pendiente' && 'border-line-strong text-ink-off',
              p.estado === 'omitido' && 'border-dashed border-line text-ink-off opacity-50')}>
            <Icon size={13} strokeWidth={2} />
            <span className="sr-only">{p.nombre}: {p.estado}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function HitoCard({ hito, ejes, compacto = false }: { hito: Hito; ejes: Eje[]; compacto?: boolean }) {
  const eje = ejes.find((e) => e.id === hito.eje_id)
  const paises = [...(hito.hito_paises ?? [])].sort((a, b) => Number(b.principal) - Number(a.principal))
  return (
    <Link href={`/hitos/${hito.id}`}
      className="block rounded-box border border-line bg-surface p-4 transition hover:border-brand focus-visible:border-brand">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight">{hito.nombre}</h3>
        <SemaforoDot valor={hito.semaforo} />
      </div>
      <p className="text-[13px] text-ink-muted">
        {rangoFechas(hito.fecha_inicio, hito.fecha_fin)}{hito.fecha_por_confirmar && ' · por confirmar'}
      </p>
      {!compacto && (hito.ciudad || hito.venue) && (
        <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-muted"><MapPin size={12} />{[hito.ciudad, hito.venue].filter(Boolean).join(' · ')}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {paises.map((p) => <span key={p.pais_codigo} className={cn('chip', p.principal && 'border-brand/60 text-ink')}>{p.pais_codigo}</span>)}
        {eje && <EjeChip nombre={eje.nombre} color={eje.color} />}
        {hito.estado !== 'activo' && <span className="chip">{hito.estado === 'en_pausa' ? 'En pausa' : hito.estado === 'cerrado' ? 'Cerrado' : 'Descartado'}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[12px] font-medium text-brand-light">{NOMBRE_ETAPA[hito.etapa_id]}</span>
        <Progreso hito={hito} />
      </div>
    </Link>
  )
}
