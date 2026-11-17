'use client'
import { ActionForm } from '@/components/forms/action-form'
import { Field } from '@/components/ui'
import { TIPO_LABEL } from '@/lib/constants'
import { crearHito } from '../actions'
import type { Eje, Pais } from '@/lib/types'

export function NuevoHitoForm({ ejes, paises, monedas, soloSocial }: { ejes: Eje[]; paises: Pais[]; monedas: string[]; soloSocial: boolean }) {
  return (
    <ActionForm action={(fd) => crearHito(null, fd)} submit="Crear hito en Radar" className="card max-w-3xl !space-y-5">
      <p className="text-[14px] text-ink-muted">Ficha mínima del Radar. Podrás completarla después; la compuerta pide lo obligatorio según el tipo de hito.</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre *" htmlFor="nombre"><input id="nombre" name="nombre" required className="field" /></Field>
        <Field label="Tipo *" htmlFor="tipo">
          <select id="tipo" name="tipo" className="field" defaultValue={soloSocial ? 'accion_social' : 'evento_externo'}>
            {Object.entries(TIPO_LABEL).filter(([k]) => !soloSocial || k === 'accion_social').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Eje principal *" htmlFor="eje_id">
          <select id="eje_id" name="eje_id" className="field" defaultValue={soloSocial ? 4 : 1}>
            {ejes.filter((e) => !soloSocial || e.id === 4).map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </Field>
        <Field label="Ejes secundarios (opcional)">
          <div className="flex flex-wrap gap-3 pt-2">
            {ejes.map((e) => (
              <label key={e.id} className="flex min-h-[32px] items-center gap-2 text-[14px]"><input type="checkbox" name="ejes_secundarios" value={e.id} className="h-4 w-4 accent-[#FF6F20]" />{e.nombre}</label>
            ))}
          </div>
        </Field>
        <Field label="Fecha de inicio *" htmlFor="fecha_inicio"><input id="fecha_inicio" type="date" name="fecha_inicio" required className="field" /></Field>
        <Field label="Fecha de fin" htmlFor="fecha_fin"><input id="fecha_fin" type="date" name="fecha_fin" className="field" /></Field>
        <Field label="Hora de inicio (hora local del país)" htmlFor="hora_inicio"><input id="hora_inicio" type="time" name="hora_inicio" className="field" /></Field>
        <label className="flex min-h-[44px] items-center gap-2 self-end text-[14px]"><input type="checkbox" name="fecha_por_confirmar" className="h-5 w-5 accent-[#FF6F20]" />Fecha por confirmar con el organizador</label>
        <Field label="Ciudad" htmlFor="ciudad"><input id="ciudad" name="ciudad" className="field" /></Field>
        <Field label="Venue" htmlFor="venue"><input id="venue" name="venue" className="field" /></Field>
        <Field label="Organizador" htmlFor="organizador"><input id="organizador" name="organizador" className="field" /></Field>
        <Field label="Link del evento" htmlFor="url"><input id="url" type="url" name="url" className="field" placeholder="https://" /></Field>
        <Field label="Asistentes estimados" htmlFor="asistentes_estimados"><input id="asistentes_estimados" inputMode="numeric" name="asistentes_estimados" className="field" /></Field>
        <div className="grid grid-cols-[1fr_96px] gap-2">
          <Field label="Costo estimado" htmlFor="costo_estimado"><input id="costo_estimado" inputMode="decimal" name="costo_estimado" className="field" /></Field>
          <Field label="Moneda" htmlFor="moneda"><select id="moneda" name="moneda" className="field">{monedas.map((m) => <option key={m}>{m}</option>)}</select></Field>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="País principal *" htmlFor="pais_principal">
          <select id="pais_principal" name="pais_principal" className="field" defaultValue="CO">
            {paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
          </select>
        </Field>
      </div>
      <fieldset>
        <legend className="label">Otros países (un hito digital puede marcar varios)</legend>
        <div className="grid max-h-56 grid-cols-2 gap-x-4 overflow-y-auto rounded-field border border-line-strong p-3 md:grid-cols-3">
          {paises.map((p) => (
            <label key={p.codigo} className="flex min-h-[36px] items-center gap-2 text-[14px]">
              <input type="checkbox" name="paises" value={p.codigo} className="h-4 w-4 accent-[#FF6F20]" />{p.nombre}
            </label>
          ))}
        </div>
      </fieldset>
    </ActionForm>
  )
}
