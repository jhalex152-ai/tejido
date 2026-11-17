import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, Calendar, ExternalLink, MapPin } from 'lucide-react'
import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { HITO_SELECT, getCatalogos } from '@/lib/data'
import { EjeChip, ICONOS, SemaforoDot, cn } from '@/components/ui'
import { MOVILIZADORES, NOMBRE_ETAPA, TIPO_LABEL } from '@/lib/constants'
import { fechaCorta, horaConZona, rangoFechas } from '@/lib/fechas'
import { puntosProgreso } from '@/lib/progreso'
import { puedeEscribir, puedeLeer, verAuditoria } from '@/lib/permisos'
import type { Hito } from '@/lib/types'
import { AprobarCompuerta } from './aprobar'
import { Resumen } from './tabs/resumen'
import { Evaluacion } from './tabs/evaluacion'
import { Datos } from './tabs/datos'
import { Narrativa } from './tabs/narrativa'
import { Evento } from './tabs/evento'
import { Captura } from './tabs/captura'
import { Social } from './tabs/social'
import { Medios } from './tabs/medios'
import { Cierre } from './tabs/cierre'
import { Actividad } from './tabs/actividad'

const TAB_DE_ETAPA: Record<number, string> = { 0: 'resumen', 1: 'evaluacion', 2: 'datos', 3: 'narrativa', 4: 'evento', 5: 'evento', 6: 'medios', 7: 'cierre' }

export default async function DetalleHito({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const u = await requireStaff()
  const { id } = await params
  const { tab: tabParam } = await searchParams
  const sb = await createClient()
  const { data } = await sb.from('hitos').select(HITO_SELECT).eq('id', id).maybeSingle()
  if (!data) notFound()
  const hito = data as unknown as Hito
  const [cat, tipoRes, faltRes] = await Promise.all([
    getCatalogos(),
    sb.from('tipos_hito').select('*').eq('tipo', hito.tipo).single(),
    hito.estado === 'activo' ? sb.rpc('faltantes_compuerta', { p_hito: id }) : Promise.resolve({ data: [] as string[] }),
  ])
  const tipo = tipoRes.data as { es_evento: boolean; usa_captura: boolean; es_social: boolean }
  const faltantes = (faltRes.data ?? []) as string[]
  const eje = cat.ejes.find((e) => e.id === hito.eje_id)
  const etapa = cat.etapas.find((e) => e.id === hito.etapa_id)!
  const paises = [...(hito.hito_paises ?? [])].sort((a, b) => Number(b.principal) - Number(a.principal))
  const pPrincipal = cat.paises.find((p) => p.codigo === paises[0]?.pais_codigo)
  const hora = horaConZona(hito.fecha_inicio, hito.hora_inicio, pPrincipal?.zona_horaria ?? null)
  const hitoEtapaActual = hito.hito_etapas?.find((e) => e.etapa_id === hito.etapa_id)

  const tabs = [
    { k: 'resumen', t: 'Resumen', ver: true },
    { k: 'evaluacion', t: 'Evaluación', ver: puedeLeer(u.rol, 'evaluacion') },
    { k: 'datos', t: 'Datos', ver: puedeLeer(u.rol, 'datos') },
    { k: 'narrativa', t: 'Narrativa', ver: puedeLeer(u.rol, 'narrativa') },
    { k: 'evento', t: 'Evento', ver: puedeLeer(u.rol, 'evento') && (tipo.es_evento || tipo.es_social) },
    { k: 'captura', t: 'Captura', ver: puedeLeer(u.rol, 'captura') && tipo.usa_captura },
    { k: 'social', t: 'Social', ver: puedeLeer(u.rol, 'social') && (tipo.es_social || hito.eje_id === 4) },
    { k: 'medios', t: 'Medios', ver: puedeLeer(u.rol, 'medios') },
    { k: 'cierre', t: 'Cierre', ver: puedeLeer(u.rol, 'cierre') },
    { k: 'actividad', t: 'Actividad', ver: verAuditoria(u.rol) },
  ].filter((t) => t.ver)
  const tab = tabs.some((t) => t.k === tabParam) ? tabParam! : 'resumen'

  const puedeAprobar = hito.estado === 'activo' && etapa.roles_aprobadores.includes(u.rol) && u.rol !== 'admin'
    ? puedeEscribir(u.rol, ({ 0: 'ficha', 1: 'evaluacion', 2: 'datos', 3: 'narrativa', 4: 'evento', 5: 'evento', 6: 'medios', 7: 'cierre' } as const)[hito.etapa_id as 0])
    : false
  const esAdmin = u.rol === 'admin'
  const props = { hito, u, cat, tipo }

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/hitos" className="inline-flex min-h-[44px] items-center text-[13px] text-ink-muted hover:text-ink">← Hitos</Link>

      <header className="card-raised mt-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{TIPO_LABEL[hito.tipo]}</p>
            <h1 className="mt-1 text-2xl md:text-3xl">{hito.nombre}</h1>
          </div>
          <div className="flex items-center gap-2">
            <SemaforoDot valor={hito.semaforo} label />
            {hito.estado !== 'activo' && <span className="chip-brand">{hito.estado === 'en_pausa' ? 'En pausa' : hito.estado === 'cerrado' ? 'Cerrado' : 'Descartado'}</span>}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] text-ink-soft">
          <span className="flex items-center gap-1.5"><Calendar size={14} className="text-brand-light" />{rangoFechas(hito.fecha_inicio, hito.fecha_fin)} · {hito.fecha_inicio.slice(0, 4)}{hito.fecha_por_confirmar && ' (por confirmar)'}{hora && ` · ${hora}`}</span>
          {(hito.ciudad || hito.venue) && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-brand-light" />{[hito.ciudad, hito.venue].filter(Boolean).join(' · ')}</span>}
          {hito.url && <a href={hito.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 underline"><ExternalLink size={14} />Sitio del evento</a>}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {paises.map((p) => <span key={p.pais_codigo} className={cn('chip', p.principal && 'border-brand/60 text-ink')}>{cat.paises.find((c) => c.codigo === p.pais_codigo)?.nombre ?? p.pais_codigo}</span>)}
          {eje && <EjeChip nombre={eje.nombre} color={eje.color} />}
          {hito.puntaje_evaluacion != null && <span className="chip">Evaluación {hito.puntaje_evaluacion}/30</span>}
        </div>

        <ol className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4" aria-label="Los 4 movilizadores">
          {puntosProgreso(hito.hito_etapas).map((p, i) => {
            const Icon = ICONOS[p.icono]!
            return (
              <li key={p.id} className={cn('flex items-center gap-3 rounded-box border p-3',
                p.estado === 'hecho' && 'border-brand/50 bg-[rgba(255,111,32,0.08)]', p.estado === 'actual' && 'border-brand shadow-glow',
                p.estado === 'pendiente' && 'border-line', p.estado === 'omitido' && 'border-dashed border-line opacity-50')}>
                <span className={cn('grid h-9 w-9 place-items-center rounded-full', p.estado === 'hecho' ? 'bg-brand-gradient text-bg' : 'bg-surface-muted text-brand-light')}><Icon size={16} /></span>
                <div><p className="text-[11px] uppercase tracking-wider text-ink-muted">{i + 1} · {MOVILIZADORES[i]!.nombre}</p>
                  <p className="text-[13px] font-medium">{({ hecho: 'Aprobado', actual: 'En curso', pendiente: 'Pendiente', omitido: 'No aplica' })[p.estado]}</p></div>
              </li>
            )
          })}
        </ol>
      </header>

      {hito.estado === 'activo' && (
        <section className="mt-4 rounded-card border border-line bg-surface p-5" aria-labelledby="compuerta">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="eyebrow">Etapa {etapa.orden} · {etapa.nombre}</p>
              <h2 id="compuerta" className="text-lg">{faltantes.length === 0 ? 'La compuerta está lista para aprobar' : `Falta${faltantes.length > 1 ? 'n' : ''} ${faltantes.length} cosa${faltantes.length > 1 ? 's' : ''} para la compuerta`}</h2>
            </div>
            {hitoEtapaActual?.vence_en && <p className="text-[13px] text-ink-muted">Plazo sugerido: {fechaCorta(hitoEtapaActual.vence_en)}</p>}
          </div>
          {etapa.descripcion && <p className="mt-1 text-[13px] text-ink-muted">Compuerta: {etapa.descripcion}</p>}
          {faltantes.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {faltantes.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[14px]">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-sem-amber" />
                  <Link href={`/hitos/${id}?tab=${TAB_DE_ETAPA[hito.etapa_id]}`} className="underline decoration-line-strong underline-offset-2 hover:decoration-brand">{f}</Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <AprobarCompuerta id={id} etapa={NOMBRE_ETAPA[hito.etapa_id]!} puedeAprobar={puedeAprobar || (esAdmin)} esAdmin={esAdmin} hayFaltantes={faltantes.length > 0} />
            {!puedeAprobar && !esAdmin && <p className="text-[13px] text-ink-muted">La compuerta de {etapa.nombre} la aprueba: {etapa.roles_aprobadores.join(', ')}.</p>}
          </div>
        </section>
      )}

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Secciones del hito">
        {tabs.map((t) => (
          <Link key={t.k} href={`/hitos/${id}?tab=${t.k}`} aria-current={tab === t.k ? 'page' : undefined}
            className={cn('min-h-[44px] shrink-0 border-b-2 px-4 py-3 text-[14px] font-medium', tab === t.k ? 'border-brand text-ink' : 'border-transparent text-ink-muted hover:text-ink')}>
            {t.t}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'resumen' && <Resumen {...props} />}
        {tab === 'evaluacion' && <Evaluacion {...props} />}
        {tab === 'datos' && <Datos {...props} />}
        {tab === 'narrativa' && <Narrativa {...props} />}
        {tab === 'evento' && <Evento {...props} />}
        {tab === 'captura' && <Captura {...props} />}
        {tab === 'social' && <Social {...props} />}
        {tab === 'medios' && <Medios {...props} />}
        {tab === 'cierre' && <Cierre {...props} />}
        {tab === 'actividad' && <Actividad {...props} />}
      </div>
    </div>
  )
}
