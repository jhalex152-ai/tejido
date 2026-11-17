import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ActionForm, ActionButton } from '@/components/forms/action-form'
import { Field } from '@/components/ui'
import { puedeEscribir, puedeLeer } from '@/lib/permisos'
import { activacion, cumplimientoMeta, fmtNum, fmtPct, semaforoMeta, tasaCalificacion, tasaCaptura } from '@/lib/kpis'
import { aprobarPlan, generarCanal, guardarPlan, guardarResultados } from '../../actions-captura'
import type { HitoVertical, ResultadoLeads } from '@/lib/types'
import type { TabProps } from './tipos'

const SEM = { verde: 'text-sem-green', ambar: 'text-sem-amber', rojo: 'text-sem-red' } as const

export async function Captura({ hito, u, cat }: TabProps) {
  const sb = await createClient()
  const escribe = puedeEscribir(u.rol, 'captura')
  const verRes = puedeLeer(u.rol, 'resultados')
  const cargaRes = puedeEscribir(u.rol, 'resultados')
  const [{ data: hv }, { data: planes }, { data: canales }, { data: res }] = await Promise.all([
    sb.from('hito_verticales').select('*').eq('hito_id', hito.id).neq('rol', 'no_va'),
    sb.from('planes_captura').select('*').eq('hito_id', hito.id),
    sb.from('canales_captura').select('*'),
    verRes ? sb.from('resultados_leads').select('*').eq('hito_id', hito.id) : Promise.resolve({ data: [] }),
  ])
  const matriz = (hv ?? []) as HitoVertical[]

  if (matriz.length === 0) {
    return <p className="rounded-box border border-dashed border-line-strong p-8 text-center text-ink-muted">Ninguna vertical es Protagonista o Presente todavía. Defínelas en la pestaña Evaluación (matriz de verticales).</p>
  }

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-[14px] text-ink-muted">
        La app no captura leads: define <b>cómo</b> los captura el CRM por evento y vertical, y guarda solo las cifras agregadas que entrega. No se guardan nombres, teléfonos ni correos.
      </p>
      {matriz.map((m) => {
        const v = cat.verticales.find((x) => x.id === m.vertical_id)
        if (!v) return null
        const plan = (planes ?? []).find((p) => p.vertical_id === m.vertical_id)
        const canal = plan && (canales ?? []).find((c) => c.plan_id === plan.id)
        const r = ((res ?? []) as ResultadoLeads[]).find((x) => x.vertical_id === m.vertical_id)
        const emb = r && { audienciaObjetivo: m.audiencia_objetivo, metaLeads: m.meta_leads, capturados: r.capturados, calificados: r.calif_a + r.calif_b, registros: r.registros, activados: r.activados_30d }
        const cumpl = emb ? cumplimientoMeta(emb) : null
        const sem = semaforoMeta(cumpl, cat.umbrales)
        return (
          <section key={v.id} className="card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg">{v.nombre} <span className="text-[14px] font-normal text-ink-muted">· {m.rol === 'protagonista' ? 'Protagonista' : 'Presente'} · audiencia {fmtNum(m.audiencia_objetivo)} · meta {fmtNum(m.meta_leads)}</span></h2>
              {plan?.aprobado ? <span className="chip-brand">Plan aprobado</span> : <span className="chip">Plan sin aprobar</span>}
            </div>

            <h3 className="eyebrow mb-2">Plan de captura</h3>
            <fieldset disabled={!escribe}>
              <ActionForm action={guardarPlan.bind(null, hito.id)} autosave>
                <input type="hidden" name="vertical_id" value={v.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Método de captura" htmlFor={`mt-${v.id}`}><input id={`mt-${v.id}`} name="metodo" defaultValue={plan?.metodo ?? ''} placeholder="QR a landing + tablet, escarapela, lista del organizador…" className="field" /></Field>
                  <Field label="Destino en el CRM" htmlFor={`d-${v.id}`}><input id={`d-${v.id}`} name="destino_crm" defaultValue={plan?.destino_crm ?? ''} placeholder='Formulario "Eventos ROAX"' className="field" /></Field>
                  <Field label="Preguntas de calificación (A/B/C)" htmlFor={`q-${v.id}`} hint={Object.keys(v.reglas_calificacion).length ? Object.entries(v.reglas_calificacion).map(([k, t]) => `${k}: ${t}`).join(' · ') : undefined}><textarea id={`q-${v.id}`} name="preguntas" rows={2} defaultValue={plan?.preguntas ?? ''} className="field" /></Field>
                  <div className="grid gap-4">
                    <Field label="Responsable en sitio" htmlFor={`rs-${v.id}`}><input id={`rs-${v.id}`} name="responsable" defaultValue={plan?.responsable ?? ''} className="field" /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Seguimiento (horas)" htmlFor={`sh-${v.id}`}><input id={`sh-${v.id}`} inputMode="numeric" name="seguimiento_horas" defaultValue={plan?.seguimiento_horas ?? 48} className="field" /></Field>
                      <Field label="Meta de leads calif." htmlFor={`mg-${v.id}`}><input id={`mg-${v.id}`} inputMode="numeric" name="meta" defaultValue={plan?.meta ?? m.meta_leads ?? ''} className="field" /></Field>
                    </div>
                  </div>
                </div>
              </ActionForm>
            </fieldset>
            {plan && u.rol === 'admin' && (
              <div className="mt-2"><ActionButton action={aprobarPlan.bind(null, hito.id, plan.id, !plan.aprobado)} className={plan.aprobado ? 'btn-outline' : 'btn-primary'}>{plan.aprobado ? 'Quitar aprobación' : 'Aprobar plan de captura'}</ActionButton></div>
            )}
            {plan && !plan.aprobado && u.rol !== 'admin' && <p className="mt-2 text-[12px] text-ink-faint">Un administrador aprueba el plan. Sin aprobarlo, la compuerta de Preparación no pasa.</p>}

            {plan && (
              <div className="mt-5 rounded-box border border-line p-4">
                <h3 className="eyebrow mb-2">Link UTM, código y QR</h3>
                <fieldset disabled={!escribe}>
                  <ActionForm action={generarCanal.bind(null, hito.id, plan.id)} submit={canal ? 'Regenerar' : 'Generar link y código'} outline>
                    <Field label="Link de destino en el CRM (formulario o landing)" htmlFor={`ud-${v.id}`}><input id={`ud-${v.id}`} type="url" name="url_destino" defaultValue={canal?.url_destino ?? ''} placeholder="https://" className="field" /></Field>
                  </ActionForm>
                </fieldset>
                {canal && (
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
                    <div className="min-w-0 space-y-2 text-[13px]">
                      <p>Código de evento: <b className="text-brand-light text-[16px]">{canal.codigo}</b></p>
                      <p className="break-all rounded-field bg-surface-muted p-2 font-mono text-[12px] text-ink-soft">{canal.url_final}</p>
                      <dl className="grid grid-cols-[110px_1fr] gap-y-0.5 text-ink-muted">
                        {Object.entries(canal.utm as Record<string, string>).map(([k, val]) => (<><dt key={k}>{k}</dt><dd key={k + 'v'} className="text-ink-soft">{val}</dd></>))}
                      </dl>
                    </div>
                    <div className="text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/qr/${canal.id}`} alt={`QR del código ${canal.codigo}`} width={160} height={160} className="mx-auto rounded-field bg-white p-1" />
                      <a href={`/api/qr/${canal.id}?descargar=1`} className="btn-outline mt-2 w-full"><Download size={14} />Descargar QR</a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {verRes && (
              <div className="mt-5 rounded-box border border-line p-4">
                <div className="mb-3 flex items-center justify-between"><h3 className="eyebrow">Resultados del CRM (cifras agregadas)</h3>
                  {sem && <span className={`text-[13px] font-semibold ${SEM[sem]}`}>Meta: {fmtPct(cumpl)}</span>}</div>
                {emb && (
                  <dl className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
                    {[
                      ['Audiencia objetivo', fmtNum(m.audiencia_objetivo)], ['Capturados', fmtNum(emb.capturados)], ['Calificados A+B', fmtNum(emb.calificados)],
                      ['Tasa de captura', fmtPct(tasaCaptura(emb))], ['Tasa de calificación', fmtPct(tasaCalificacion(emb))], ['Activación 30 d', fmtPct(activacion(emb))],
                    ].map(([k, val]) => (<div key={k}><dt className="text-[11px] uppercase tracking-wider text-ink-muted">{k}</dt><dd className="text-xl font-bold tracking-tight">{val}</dd></div>))}
                  </dl>
                )}
                {cargaRes ? (
                  <ActionForm action={guardarResultados.bind(null, hito.id, v.id)} submit="Guardar resultados">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
                      {([['capturados', 'Capturados'], ['calif_a', 'Calif. A'], ['calif_b', 'Calif. B'], ['calif_c', 'Calif. C'], ['existentes', 'Existentes'], ['registros', 'Registros en Dropi'], ['activados_30d', 'Activos a 30 d']] as const).map(([k, l]) => (
                        <Field key={k} label={l} htmlFor={`${k}-${v.id}`}><input id={`${k}-${v.id}`} inputMode="numeric" name={k} defaultValue={r?.[k] ?? 0} className="field" /></Field>
                      ))}
                    </div>
                    <p className="text-[12px] text-ink-faint">Carga manual en el MVP; el CSV del CRM llega en la fase 2. “Existentes” son leads que ya eran usuarios de Dropi.</p>
                  </ActionForm>
                ) : !r && <p className="text-[14px] text-ink-muted">Datos carga los resultados en el Cierre.</p>}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
