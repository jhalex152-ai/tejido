import { createClient } from '@/lib/supabase/server'
import { listarPersonas } from '@/lib/data'
import { ActionForm, ActionButton } from '@/components/forms/action-form'
import { Field, cn } from '@/components/ui'
import { TIPO_LABEL } from '@/lib/constants'
import { fechaCorta } from '@/lib/fechas'
import { puedeEscribir, puedeLeer } from '@/lib/permisos'
import { asignar, guardarEntregable, guardarFicha, guardarPaises, quitarAsignacion } from '../../actions'
import { CambiarEstado } from '../estado'
import type { TabProps } from './tipos'

export async function Resumen({ hito, u, cat, tipo }: TabProps) {
  const sb = await createClient()
  const puedeFicha = puedeEscribir(u.rol, 'ficha')
  const puedeAsignar = puedeEscribir(u.rol, 'evaluacion')
  const [{ data: asig }, personas, { data: ent }, { data: pres }] = await Promise.all([
    sb.from('hito_asignaciones').select('user_id,funcion,profiles(nombre)').eq('hito_id', hito.id),
    puedeAsignar ? listarPersonas() : Promise.resolve([]),
    sb.from('entregables').select('id,valor,completo,plantillas_entregables(nombre,etapa_id,obligatorio,orden)').eq('hito_id', hito.id),
    puedeLeer(u.rol, 'presupuesto') ? sb.from('presupuestos').select('costo_estimado').eq('hito_id', hito.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const entregables = ((ent ?? []) as unknown as { id: string; valor: { texto?: string } | null; completo: boolean; plantillas_entregables: { nombre: string; etapa_id: number; obligatorio: boolean; orden: number } }[])
    .filter((e) => e.plantillas_entregables.etapa_id === hito.etapa_id)
    .sort((a, b) => a.plantillas_entregables.orden - b.plantillas_entregables.orden)
  const paisesSel = hito.hito_paises ?? []
  const principal = paisesSel.find((p) => p.principal)?.pais_codigo

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="card">
          <h2 className="mb-4 text-lg">Ficha del hito</h2>
          <fieldset disabled={!puedeFicha} className="disabled:opacity-80">
            <ActionForm action={(fd) => guardarFicha(hito.id, fd)} submit={puedeFicha ? 'Guardar ficha' : null} autosave={false}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre" htmlFor="r-nombre"><input id="r-nombre" name="nombre" defaultValue={hito.nombre} className="field" required /></Field>
                <Field label="Tipo" htmlFor="r-tipo">
                  <select id="r-tipo" name="tipo" defaultValue={hito.tipo} className="field">{Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                </Field>
                <Field label="Eje principal" htmlFor="r-eje">
                  <select id="r-eje" name="eje_id" defaultValue={hito.eje_id} className="field">{cat.ejes.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select>
                </Field>
                <Field label="Ejes secundarios">
                  <div className="flex flex-wrap gap-3 pt-2">{cat.ejes.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="ejes_secundarios" value={e.id} defaultChecked={hito.ejes_secundarios.includes(e.id)} className="h-4 w-4 accent-[#FF6F20]" />{e.nombre}</label>
                  ))}</div>
                </Field>
                <Field label="Inicio" htmlFor="r-ini"><input id="r-ini" type="date" name="fecha_inicio" defaultValue={hito.fecha_inicio} className="field" /></Field>
                <Field label="Fin" htmlFor="r-fin"><input id="r-fin" type="date" name="fecha_fin" defaultValue={hito.fecha_fin} className="field" /></Field>
                <Field label="Hora de inicio (hora local del país)" htmlFor="r-hora"><input id="r-hora" type="time" name="hora_inicio" defaultValue={hito.hora_inicio?.slice(0, 5) ?? ''} className="field" /></Field>
                <label className="flex min-h-[44px] items-center gap-2 self-end text-[14px]"><input type="checkbox" name="fecha_por_confirmar" defaultChecked={hito.fecha_por_confirmar} className="h-5 w-5 accent-[#FF6F20]" />Fecha por confirmar</label>
                <Field label="Ciudad" htmlFor="r-ciudad"><input id="r-ciudad" name="ciudad" defaultValue={hito.ciudad ?? ''} className="field" /></Field>
                <Field label="Venue" htmlFor="r-venue"><input id="r-venue" name="venue" defaultValue={hito.venue ?? ''} className="field" /></Field>
                <Field label="Organizador" htmlFor="r-org"><input id="r-org" name="organizador" defaultValue={hito.organizador ?? ''} className="field" /></Field>
                <Field label="Link" htmlFor="r-url"><input id="r-url" type="url" name="url" defaultValue={hito.url ?? ''} className="field" /></Field>
                <Field label="Asistentes estimados" htmlFor="r-ae"><input id="r-ae" inputMode="numeric" name="asistentes_estimados" defaultValue={hito.asistentes_estimados ?? ''} className="field" /></Field>
                <Field label="Asistencia real (la reporta el organizador)" htmlFor="r-ar"><input id="r-ar" inputMode="numeric" name="asistentes_reales" defaultValue={hito.asistentes_reales ?? ''} className="field" /></Field>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  {puedeLeer(u.rol, 'presupuesto')
                    ? <Field label="Costo estimado" htmlFor="r-ce"><input id="r-ce" inputMode="decimal" name="costo_estimado" defaultValue={pres?.costo_estimado ?? ''} className="field" /></Field>
                    : <div />}
                  <Field label="Moneda" htmlFor="r-mon"><select id="r-mon" name="moneda" defaultValue={hito.moneda} className="field">{cat.monedas.map((m) => <option key={m.codigo}>{m.codigo}</option>)}</select></Field>
                </div>
              </div>
            </ActionForm>
          </fieldset>
        </section>

        <section className="card">
          <h2 className="mb-1 text-lg">Países</h2>
          <p className="mb-4 text-[13px] text-ink-muted">Todo hito tiene país. Un hito digital (webinar, live) puede marcar varios.</p>
          <fieldset disabled={!puedeFicha}>
            <ActionForm action={(fd) => guardarPaises(hito.id, fd)} submit={puedeFicha ? 'Guardar países' : null}>
              <Field label="País principal" htmlFor="r-pp">
                <select id="r-pp" name="principal" defaultValue={principal} className="field md:w-72">{cat.paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}</select>
              </Field>
              <div className="grid max-h-52 grid-cols-2 gap-x-4 overflow-y-auto rounded-field border border-line-strong p-3 md:grid-cols-3">
                {cat.paises.map((p) => (
                  <label key={p.codigo} className="flex min-h-[36px] items-center gap-2 text-[14px]"><input type="checkbox" name="paises" value={p.codigo} defaultChecked={paisesSel.some((x) => x.pais_codigo === p.codigo)} className="h-4 w-4 accent-[#FF6F20]" />{p.nombre}</label>
                ))}
              </div>
            </ActionForm>
          </fieldset>
        </section>

        <section className="card">
          <h2 className="mb-1 text-lg">Estado del hito</h2>
          <CambiarEstado id={hito.id} estado={hito.estado} puedeCambiar={puedeFicha && ['admin', 'lider_eventos', 'lider_impacto'].includes(u.rol)} esAdmin={u.rol === 'admin'} />
          {hito.motivo_estado && <p className="mt-3 text-[13px] text-ink-muted">Motivo registrado: {hito.motivo_estado}</p>}
        </section>
      </div>

      <div className="space-y-6">
        {entregables.length > 0 && (
          <section className="card">
            <h2 className="mb-1 text-lg">Entregables de la etapa</h2>
            <p className="mb-3 text-[13px] text-ink-muted">Los obligatorios bloquean la compuerta hasta que estén completos.</p>
            <ul className="space-y-3">
              {entregables.map((e) => (
                <li key={e.id} className="rounded-field border border-line p-3">
                  <ActionForm action={(fd) => guardarEntregable(hito.id, e.id, fd)} autosave delay={900}>
                    <label className="flex min-h-[44px] items-center gap-3">
                      <input type="checkbox" name="completo" defaultChecked={e.completo} className="h-5 w-5 accent-[#FF6F20]" />
                      <span className="text-[14px] font-medium">{e.plantillas_entregables.nombre}{e.plantillas_entregables.obligatorio && <span className="ml-1 text-brand-light">*</span>}</span>
                    </label>
                    <input name="valor" defaultValue={e.valor?.texto ?? ''} placeholder="Detalle o enlace" aria-label={`Detalle de ${e.plantillas_entregables.nombre}`} className="field" />
                  </ActionForm>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card">
          <h2 className="mb-3 text-lg">Equipo asignado</h2>
          <ul className="mb-3 space-y-2">
            {((asig ?? []) as unknown as { user_id: string; funcion: string; profiles: { nombre: string } }[]).map((a) => (
              <li key={a.user_id} className="flex items-center justify-between gap-2 text-[14px]">
                <span>{a.profiles?.nombre} <span className="text-ink-muted">· {a.funcion}</span></span>
                {puedeAsignar && <ActionButton action={() => quitarAsignacion(hito.id, a.user_id)} className="text-[12px] text-ink-muted underline">Quitar</ActionButton>}
              </li>
            ))}
            {(asig ?? []).length === 0 && <li className="text-[14px] text-ink-muted">Nadie asignado todavía.</li>}
          </ul>
          {puedeAsignar && (
            <ActionForm action={(fd) => asignar(hito.id, fd)} submit="Asignar" outline reset>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <select name="user_id" aria-label="Persona" className="field" defaultValue="">{[<option key="" value="" disabled>Elige una persona</option>, ...personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)]}</select>
                <select name="funcion" aria-label="Función" className="field w-36"><option value="ejecucion">Ejecución</option><option value="logistica">Logística</option><option value="medios">Medios</option><option value="datos">Datos</option></select>
              </div>
            </ActionForm>
          )}
        </section>

        <section className="card">
          <h2 className="mb-3 text-lg">Línea de tiempo</h2>
          <ol className="space-y-2.5">
            {[...(hito.hito_etapas ?? [])].sort((a, b) => a.etapa_id - b.etapa_id).map((e) => {
              const et = cat.etapas.find((x) => x.id === e.etapa_id)!
              return (
                <li key={e.etapa_id} className="flex items-start gap-3 text-[14px]">
                  <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                    e.estado === 'aprobada' && 'bg-sem-green', e.estado === 'abierta' && 'bg-brand shadow-glow', e.estado === 'pendiente' && 'bg-ink-off', e.estado === 'omitida' && 'border border-dashed border-ink-off')} />
                  <div>
                    <p className={cn(e.estado === 'omitida' && 'text-ink-off line-through')}>{et.orden}. {et.nombre}</p>
                    <p className="text-[12px] text-ink-muted">
                      {e.estado === 'aprobada' ? `Aprobada${e.aprobada_en ? ' · ' + fechaCorta(e.aprobada_en) : ''}${e.forzada ? ' · FORZADA: ' + e.motivo : ''}`
                        : e.estado === 'omitida' ? 'No aplica a este tipo de hito' : e.vence_en ? `Plazo ${fechaCorta(e.vence_en)}` : 'Sin plazo'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-3 text-[12px] text-ink-faint">{tipo.es_evento ? 'Evento: recorre las 8 etapas.' : 'Este tipo de hito salta las etapas que no le aplican.'}</p>
        </section>
      </div>
    </div>
  )
}
