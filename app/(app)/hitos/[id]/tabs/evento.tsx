import { createClient } from '@/lib/supabase/server'
import { listarPersonas } from '@/lib/data'
import { ActionForm, ActionButton, CheckAuto } from '@/components/forms/action-form'
import { SubirArchivo } from '@/components/forms/subir-archivo'
import { Field } from '@/components/ui'
import { puedeEscribir, puedeLeer } from '@/lib/permisos'
import { fmtMoneda } from '@/lib/kpis'
import { fechaCorta } from '@/lib/fechas'
import {
  actualizarChecklist, actualizarCosto, agregarChecklist, agregarCosto, borrarChecklist, borrarCosto,
  guardarPresupuesto, guardarStand, quitarRender, registrarArchivo,
} from '../../actions'
import type { TabProps } from './tipos'

async function urlFirmada(sb: Awaited<ReturnType<typeof createClient>>, path: string | null) {
  if (!path) return null
  const { data } = await sb.storage.from('archivos').createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

export async function Evento({ hito, u, cat, tipo }: TabProps) {
  const sb = await createClient()
  const escribe = puedeEscribir(u.rol, 'evento')
  const verCostos = puedeLeer(u.rol, 'costos_items')
  const verPres = puedeLeer(u.rol, 'presupuesto')
  const [{ data: st }, { data: lista }, { data: costos }, { data: pres }, personas] = await Promise.all([
    tipo.es_evento ? sb.from('stands').select('*').eq('hito_id', hito.id).maybeSingle() : Promise.resolve({ data: null }),
    sb.from('checklist_items').select('*').eq('hito_id', hito.id).order('critico', { ascending: false }).order('creado_en'),
    verCostos ? sb.from('costos_items').select('*').eq('hito_id', hito.id).order('concepto') : Promise.resolve({ data: [] }),
    verPres ? sb.from('presupuestos').select('*').eq('hito_id', hito.id).maybeSingle() : Promise.resolve({ data: null }),
    listarPersonas(),
  ])
  const plano = await urlFirmada(sb, st?.plano_path ?? null)
  const renders = await Promise.all(((st?.renders ?? []) as string[]).map(async (p) => ({ path: p, url: await urlFirmada(sb, p) })))
  const items = lista ?? []
  const criticos = items.filter((i) => i.critico)
  const pctCrit = criticos.length ? Math.round((criticos.filter((i) => i.completo).length / criticos.length) * 100) : null
  const totales = (costos ?? []).reduce<Record<string, number>>((a, c) => ({ ...a, [c.moneda]: (a[c.moneda] ?? 0) + Number(c.valor) }), {})

  return (
    <div className="space-y-6">
      {tipo.es_evento && (
        <section className="card">
          <h2 className="mb-4 text-lg">Stand</h2>
          <fieldset disabled={!escribe}>
            <ActionForm action={(fd) => guardarStand(hito.id, fd)} autosave>
              <div className="grid gap-4 md:grid-cols-4">
                <Field label="Ancho (m)" htmlFor="s-a"><input id="s-a" inputMode="decimal" name="ancho_m" defaultValue={st?.ancho_m ?? ''} className="field" /></Field>
                <Field label="Fondo (m)" htmlFor="s-f"><input id="s-f" inputMode="decimal" name="fondo_m" defaultValue={st?.fondo_m ?? ''} className="field" /></Field>
                <div><span className="label">Área</span><p className="flex min-h-[44px] items-center text-xl font-bold text-brand-light">{st?.m2 ? `${Number(st.m2)} m²` : '—'}</p></div>
                <Field label="Tipo de stand" htmlFor="s-t"><input id="s-t" name="tipo" defaultValue={st?.tipo ?? ''} className="field" placeholder="Isla, esquina, lineal…" /></Field>
              </div>
              <Field label="Concepto" htmlFor="s-c"><textarea id="s-c" name="concepto" rows={2} defaultValue={st?.concepto ?? ''} className="field" /></Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Proveedores" htmlFor="s-p"><textarea id="s-p" name="proveedores" rows={2} defaultValue={st?.proveedores ?? ''} className="field" /></Field>
                <Field label="Cronograma de montaje" htmlFor="s-m"><textarea id="s-m" name="cronograma_montaje" rows={2} defaultValue={st?.cronograma_montaje ?? ''} className="field" /></Field>
              </div>
            </ActionForm>
          </fieldset>
          {escribe && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SubirArchivo hitoId={hito.id} carpeta="plano" etiqueta="Plano del stand (PDF o imagen)" registrar={registrarArchivo.bind(null, hito.id, 'plano')} />
              <SubirArchivo hitoId={hito.id} carpeta="renders" etiqueta="Render (imagen)" accept="image/*" registrar={registrarArchivo.bind(null, hito.id, 'render')} />
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-[14px]">
            {plano && <a href={plano} target="_blank" rel="noreferrer" className="chip-brand underline">Ver plano</a>}
            {renders.map((r, i) => r.url && (
              <span key={r.path} className="inline-flex items-center gap-2"><a href={r.url} target="_blank" rel="noreferrer" className="chip-brand underline">Render {i + 1}</a>
                {escribe && <ActionButton action={() => quitarRender(hito.id, r.path)} confirmar="¿Quitar el render?" className="text-[12px] text-ink-muted underline">quitar</ActionButton>}</span>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg">Checklist operativo</h2>
            {pctCrit != null && <span className={pctCrit === 100 ? 'chip-brand' : 'chip'}>Críticos {pctCrit}%</span>}</div>
          <ul className="divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-1">
                <fieldset disabled={!escribe} className="min-w-0 flex-1">
                  <CheckAuto action={(fd) => actualizarChecklist(hito.id, i.id, fd)} defecto={i.completo}
                    label={<>{i.concepto}{i.critico && <span className="ml-2 chip-brand">crítico</span>}{i.vence_en && <span className="ml-2 text-[12px] text-ink-muted">{fechaCorta(i.vence_en)}</span>}</>} />
                </fieldset>
                {escribe && <ActionButton action={() => borrarChecklist(hito.id, i.id)} className="px-2 text-[12px] text-ink-muted underline">Quitar</ActionButton>}
              </li>
            ))}
            {items.length === 0 && <li className="py-3 text-[14px] text-ink-muted">Aún no hay tareas. Agrega la primera.</li>}
          </ul>
          {escribe && (
            <ActionForm action={(fd) => agregarChecklist(hito.id, fd)} submit="Agregar tarea" outline reset className="mt-4">
              <input name="concepto" required aria-label="Tarea" placeholder="Ej: Confirmar montaje de stand" className="field" />
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <select name="responsable_id" aria-label="Responsable" className="field" defaultValue=""><option value="">Sin responsable</option>{personas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
                <input type="date" name="vence_en" aria-label="Fecha" className="field" />
                <label className="flex min-h-[44px] items-center gap-2 text-[14px]"><input type="checkbox" name="critico" className="h-5 w-5 accent-[#FF6F20]" />Crítico</label>
              </div>
            </ActionForm>
          )}
        </section>

        {verCostos && (
          <section className="card">
            <h2 className="mb-1 text-lg">Checklist de costos</h2>
            <p className="mb-3 text-[13px] text-ink-muted">Concepto, proveedor, valor y estado de pago.</p>
            <ul className="divide-y divide-line">
              {(costos ?? []).map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div><p className="text-[14px] font-medium">{c.concepto}</p><p className="text-[12px] text-ink-muted">{c.proveedor ?? 'Sin proveedor'} · {fmtMoneda(Number(c.valor), c.moneda)}</p></div>
                    {escribe && <ActionButton action={() => borrarCosto(hito.id, c.id)} confirmar="¿Eliminar este costo?" className="text-[12px] text-ink-muted underline">Quitar</ActionButton>}
                  </div>
                  <fieldset disabled={!escribe}>
                    <ActionForm action={(fd) => actualizarCosto(hito.id, c.id, fd)} autosave delay={400}>
                      <select name="estado_pago" aria-label={`Estado de pago de ${c.concepto}`} defaultValue={c.estado_pago} className="field mt-2 md:w-48"><option value="pendiente">Pago pendiente</option><option value="parcial">Pago parcial</option><option value="pagado">Pagado</option></select>
                    </ActionForm>
                  </fieldset>
                </li>
              ))}
              {(costos ?? []).length === 0 && <li className="py-3 text-[14px] text-ink-muted">Aún no hay costos registrados.</li>}
            </ul>
            {Object.keys(totales).length > 0 && <p className="mt-2 text-[13px] text-ink-soft">Suma de ítems: {Object.entries(totales).map(([m, v]) => fmtMoneda(v, m)).join(' · ')}</p>}
            {escribe && (
              <ActionForm action={(fd) => agregarCosto(hito.id, fd)} submit="Agregar costo" outline reset className="mt-4">
                <div className="grid gap-2 md:grid-cols-2"><input name="concepto" required aria-label="Concepto" placeholder="Concepto" className="field" /><input name="proveedor" aria-label="Proveedor" placeholder="Proveedor" className="field" /></div>
                <div className="grid grid-cols-[1fr_96px_1fr] gap-2">
                  <input name="valor" inputMode="decimal" aria-label="Valor" placeholder="Valor" className="field" />
                  <select name="moneda" aria-label="Moneda" defaultValue={hito.moneda} className="field">{cat.monedas.map((m) => <option key={m.codigo}>{m.codigo}</option>)}</select>
                  <select name="estado_pago" aria-label="Estado de pago" className="field"><option value="pendiente">Pendiente</option><option value="parcial">Parcial</option><option value="pagado">Pagado</option></select>
                </div>
              </ActionForm>
            )}
          </section>
        )}
      </div>

      {verPres && (
        <section className="card">
          <h2 className="mb-1 text-lg">Presupuesto del hito</h2>
          <p className="mb-4 text-[13px] text-ink-muted">Solo lo ven administradores, líder de eventos, líder de impacto y Datos. Moneda del hito: {hito.moneda}.</p>
          <fieldset disabled={!puedeEscribir(u.rol, 'presupuesto')}>
            <ActionForm action={(fd) => guardarPresupuesto(hito.id, fd)} autosave>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Costo estimado (Radar)" htmlFor="pr-e"><input id="pr-e" inputMode="decimal" name="costo_estimado" defaultValue={pres?.costo_estimado ?? ''} className="field" /></Field>
                <Field label="Presupuesto total" htmlFor="pr-t"><input id="pr-t" inputMode="decimal" name="presupuesto_total" defaultValue={pres?.presupuesto_total ?? ''} className="field" /></Field>
                <Field label="Costo real (para el cierre)" htmlFor="pr-r"><input id="pr-r" inputMode="decimal" name="costo_real" defaultValue={pres?.costo_real ?? ''} className="field" /></Field>
              </div>
            </ActionForm>
          </fieldset>
        </section>
      )}
    </div>
  )
}
