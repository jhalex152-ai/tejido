import { createClient } from '@/lib/supabase/server'
import { ActionForm } from '@/components/forms/action-form'
import { Field } from '@/components/ui'
import { puedeEscribir, puedeLeer } from '@/lib/permisos'
import { convertir, costoPorLead, fmtMoneda, fmtNum, fmtPct, tasaCalificacion } from '@/lib/kpis'
import { guardarCierre } from '../../actions-captura'
import { guardarPresupuesto } from '../../actions'
import type { HitoVertical, ResultadoLeads } from '@/lib/types'
import type { TabProps } from './tipos'

export async function Cierre({ hito, u, cat, tipo }: TabProps) {
  const sb = await createClient()
  const escribe = puedeEscribir(u.rol, 'cierre')
  const verCostos = puedeLeer(u.rol, 'presupuesto')
  const [{ data: c }, { data: pres }, { data: res }, { data: hv }] = await Promise.all([
    sb.from('cierres').select('*').eq('hito_id', hito.id).maybeSingle(),
    verCostos ? sb.from('presupuestos').select('*').eq('hito_id', hito.id).maybeSingle() : Promise.resolve({ data: null }),
    puedeLeer(u.rol, 'resultados') ? sb.from('resultados_leads').select('*').eq('hito_id', hito.id) : Promise.resolve({ data: [] }),
    sb.from('hito_verticales').select('*').eq('hito_id', hito.id).neq('rol', 'no_va'),
  ])
  const aprend = (c?.aprendizajes ?? []) as string[]
  const resultados = (res ?? []) as ResultadoLeads[]
  const matriz = (hv ?? []) as HitoVertical[]
  const tasas = Object.fromEntries(cat.monedas.map((m) => [m.codigo, { cop: Number(m.cop_por_unidad), usd: Number(m.usd_por_unidad) }]))
  const costoRealCOP = pres?.costo_real != null ? convertir(Number(pres.costo_real), hito.moneda, 'COP', tasas) : null
  const calificadosTotal = resultados.reduce((a, r) => a + r.calif_a + r.calif_b, 0)

  return (
    <div className="space-y-6">
      {tipo.usa_captura && (
        <section className="card overflow-x-auto">
          <h2 className="mb-1 text-lg">Leads reales por vertical</h2>
          <p className="mb-4 text-[13px] text-ink-muted">Se mide por leads, no por aforo{hito.asistentes_reales ? `: ${fmtNum(hito.asistentes_reales)} asistentes reportados` : ''}. Datos carga las cifras desde la pestaña Captura.</p>
          <table className="w-full min-w-[640px] text-left">
            <thead><tr><th className="th">Vertical</th><th className="th">Meta</th><th className="th">Capturados</th><th className="th">Calificados</th><th className="th">Calificación</th><th className="th">Registros</th><th className="th">Activos 30 d</th><th className="th">Costo / lead calif.</th></tr></thead>
            <tbody className="divide-y divide-line">
              {matriz.map((m) => {
                const v = cat.verticales.find((x) => x.id === m.vertical_id)
                const r = resultados.find((x) => x.vertical_id === m.vertical_id)
                const cal = r ? r.calif_a + r.calif_b : 0
                const cpl = costoPorLead(costoRealCOP, cal, m.participacion_costo, matriz.length)
                return (
                  <tr key={m.vertical_id}>
                    <td className="td font-medium">{v?.nombre}</td><td className="td">{fmtNum(m.meta_leads)}</td>
                    <td className="td">{r ? fmtNum(r.capturados) : '—'}</td><td className="td">{r ? fmtNum(cal) : '—'}</td>
                    <td className="td">{r ? fmtPct(tasaCalificacion({ audienciaObjetivo: m.audiencia_objetivo, metaLeads: m.meta_leads, capturados: r.capturados, calificados: cal, registros: r.registros, activados: r.activados_30d })) : '—'}</td>
                    <td className="td">{r ? fmtNum(r.registros) : '—'}</td><td className="td">{r ? fmtNum(r.activados_30d) : '—'}</td>
                    <td className="td">{cpl != null ? fmtMoneda(cpl, 'COP') : '—'}</td>
                  </tr>
                )
              })}
              {matriz.length === 0 && <tr><td colSpan={8} className="td text-ink-muted">Sin verticales presentes.</td></tr>}
            </tbody>
          </table>
          {verCostos && calificadosTotal > 0 && costoRealCOP != null && <p className="mt-3 text-[13px] text-ink-soft">Costo real total: {fmtMoneda(costoRealCOP, 'COP')} · {fmtNum(calificadosTotal)} leads calificados.</p>}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-lg">Cifras del cierre</h2>
          <p className="text-[14px] text-ink-soft">Asistencia real reportada por el organizador: <b>{hito.asistentes_reales != null ? fmtNum(hito.asistentes_reales) : 'sin registrar'}</b>. Se edita en la pestaña Resumen.</p>
          {verCostos && (
            <div className="mt-4">
              <ActionForm action={guardarPresupuesto.bind(null, hito.id)} submit={puedeEscribir(u.rol, 'presupuesto') ? 'Guardar costo real' : null} outline>
                <Field label={`Costo real del hito (${hito.moneda})`} htmlFor="cr-real"><input id="cr-real" inputMode="decimal" name="costo_real" defaultValue={pres?.costo_real ?? ''} disabled={!puedeEscribir(u.rol, 'presupuesto')} className="field" /></Field>
              </ActionForm>
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="mb-1 text-lg">3 aprendizajes</h2>
          <p className="mb-4 text-[13px] text-ink-muted">Obligatorios para cerrar el hito. Alimentan la línea base de los próximos eventos.</p>
          <fieldset disabled={!escribe}>
            <ActionForm action={guardarCierre.bind(null, hito.id)} autosave>
              {[1, 2, 3].map((n) => (
                <Field key={n} label={`Aprendizaje ${n}`} htmlFor={`ap-${n}`}><textarea id={`ap-${n}`} name={`aprendizaje_${n}`} rows={2} defaultValue={aprend[n - 1] ?? ''} className="field" /></Field>
              ))}
              <Field label="Notas" htmlFor="ap-notas"><textarea id="ap-notas" name="notas" rows={2} defaultValue={c?.notas ?? ''} className="field" /></Field>
            </ActionForm>
          </fieldset>
        </section>
      </div>
    </div>
  )
}
