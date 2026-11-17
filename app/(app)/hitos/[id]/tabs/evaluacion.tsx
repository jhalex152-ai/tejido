import { createClient } from '@/lib/supabase/server'
import { ActionForm, ActionButton } from '@/components/forms/action-form'
import { puedeEscribir } from '@/lib/permisos'
import { guardarEvaluacion, guardarVertical, quitarVertical } from '../../actions'
import type { HitoVertical } from '@/lib/types'
import type { TabProps } from './tipos'

const CRITERIOS: [string, string, string][] = [
  ['audiencia', 'Audiencia', '¿Está ahí el público de Dropi?'],
  ['mercado', 'Mercado', '¿Es un país o mercado prioritario?'],
  ['mensaje', 'Mensaje', '¿Tenemos algo relevante que contar?'],
  ['rol_posible', 'Rol posible', '¿Podemos ser protagonistas (patrocinio, speaker)?'],
  ['costo_resultado', 'Costo por resultado', '¿Se justifica lo que cuesta?'],
  ['competencia', 'Competencia', '¿Está Mastershop, Rocketfy o Triidy?'],
]
const ROL = { protagonista: 'Protagonista', presente: 'Presente', no_va: 'No va' } as const

export async function Evaluacion({ hito, u, cat, tipo }: TabProps) {
  const sb = await createClient()
  const puede = puedeEscribir(u.rol, 'evaluacion')
  const [{ data: ev }, { data: hv }] = await Promise.all([
    sb.from('evaluaciones').select('*').eq('hito_id', hito.id).maybeSingle(),
    sb.from('hito_verticales').select('*').eq('hito_id', hito.id),
  ])
  const matriz = (hv ?? []) as HitoVertical[]
  const total = ev?.total ?? 0
  const completo = ev && CRITERIOS.every(([k]) => ev[k] != null)

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><h2 className="text-lg">Filtro de 6 criterios</h2><p className="text-[13px] text-ink-muted">Califica de 1 a 5. Para pasar a Datos se necesitan 18 de 30 y la aprobación del Head.</p></div>
          <p className={`text-3xl font-bold tracking-tight ${completo ? (total >= 18 ? 'text-sem-green' : 'text-sem-amber') : 'text-ink-muted'}`}>{completo ? total : '—'}<span className="text-[14px] font-normal text-ink-muted"> / 30</span></p>
        </div>
        <fieldset disabled={!puede}>
          <ActionForm action={guardarEvaluacion.bind(null, hito.id)} autosave>
            <div className="grid gap-3 md:grid-cols-2">
              {CRITERIOS.map(([k, nombre, ayuda]) => (
                <div key={k} className="rounded-field border border-line p-3">
                  <label className="label" htmlFor={`ev-${k}`}>{nombre}</label>
                  <p className="mb-2 text-[12px] text-ink-faint">{ayuda}</p>
                  <select id={`ev-${k}`} name={k} defaultValue={ev?.[k] ?? ''} className="field"><option value="">Sin calificar</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
                </div>
              ))}
            </div>
            <div><label className="label" htmlFor="ev-notas">Notas de la evaluación</label><textarea id="ev-notas" name="notas" rows={2} defaultValue={ev?.notas ?? ''} className="field" /></div>
          </ActionForm>
        </fieldset>
      </section>

      {tipo.usa_captura ? (
        <section className="card">
          <h2 className="text-lg">Matriz de verticales</h2>
          <p className="mb-4 max-w-3xl text-[13px] text-ink-muted">
            Pertinencia (¿está su público ahí?) + importancia (¿qué tanto le sirve hoy?): <b>≥ 8 Protagonista</b>, <b>5–7 Presente</b>, <b>≤ 4 No va</b>. Es una sugerencia: el líder de eventos confirma. Las verticales Protagonista o Presente necesitan audiencia objetivo, meta de leads y plan de captura.
          </p>
          <div className="space-y-3">
            {cat.verticales.map((v) => {
              const fila = matriz.find((m) => m.vertical_id === v.id)
              return (
                <fieldset key={v.id} disabled={!puede} className="rounded-field border border-line p-3">
                  <ActionForm action={guardarVertical.bind(null, hito.id)} submit={puede ? (fila ? 'Actualizar' : 'Incluir en la matriz') : null} outline>
                    <input type="hidden" name="vertical_id" value={v.id} />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">{v.nombre}</h3>
                      {fila && <span className={`chip${fila.rol === 'protagonista' ? '-brand' : ''}`}>{ROL[fila.rol]}{fila.rol_confirmado ? ' · confirmado' : ' · sugerido'}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                      <div><label className="label" htmlFor={`p-${v.id}`}>Pertinencia</label><select id={`p-${v.id}`} name="pertinencia" defaultValue={fila?.pertinencia ?? 3} className="field">{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div>
                      <div><label className="label" htmlFor={`i-${v.id}`}>Importancia</label><select id={`i-${v.id}`} name="importancia" defaultValue={fila?.importancia ?? 3} className="field">{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div>
                      <div><label className="label" htmlFor={`a-${v.id}`}>Audiencia objetivo</label><input id={`a-${v.id}`} inputMode="numeric" name="audiencia_objetivo" defaultValue={fila?.audiencia_objetivo ?? ''} className="field" placeholder="2.000" /></div>
                      <div><label className="label" htmlFor={`m-${v.id}`}>Meta de leads calif.</label><input id={`m-${v.id}`} inputMode="numeric" name="meta_leads" defaultValue={fila?.meta_leads ?? ''} className="field" placeholder="150" /></div>
                      <div><label className="label" htmlFor={`c-${v.id}`}>% del costo</label><input id={`c-${v.id}`} inputMode="decimal" name="participacion_costo" defaultValue={fila?.participacion_costo != null ? fila.participacion_costo * 100 : ''} className="field" placeholder="auto" /></div>
                      <div className="flex flex-col justify-end gap-1">
                        <label className="flex min-h-[44px] items-center gap-2 text-[13px]"><input type="checkbox" name="rol_confirmado" defaultChecked={fila?.rol_confirmado} className="h-5 w-5 accent-[#FF6F20]" />Confirmo el rol</label>
                      </div>
                    </div>
                    <div className="max-w-xs"><label className="label" htmlFor={`r-${v.id}`}>Rol (si lo confirmas, puedes ajustarlo)</label>
                      <select id={`r-${v.id}`} name="rol" defaultValue={fila?.rol ?? ''} className="field"><option value="">Usar el sugerido</option>{Object.entries(ROL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
                  </ActionForm>
                  {fila && puede && <div className="mt-2"><ActionButton action={quitarVertical.bind(null, hito.id, v.id)} confirmar={`¿Quitar ${v.nombre} de la matriz?`} className="text-[12px] text-ink-muted underline">Quitar de la matriz</ActionButton></div>}
                </fieldset>
              )
            })}
          </div>
        </section>
      ) : (
        <p className="rounded-box border border-dashed border-line-strong p-4 text-[14px] text-ink-muted">Este tipo de hito no captura leads comerciales, así que no usa la matriz de verticales.</p>
      )}
    </div>
  )
}
