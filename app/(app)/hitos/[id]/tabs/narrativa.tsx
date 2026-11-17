import { createClient } from '@/lib/supabase/server'
import { ActionForm, ActionButton } from '@/components/forms/action-form'
import { Field } from '@/components/ui'
import { puedeEscribir } from '@/lib/permisos'
import { agregarPieza, borrarPieza, estadoPieza, guardarNarrativa } from '../../actions'
import type { TabProps } from './tipos'

const TIPO_PIEZA = { charla: 'Charla', one_pager: 'One-pager', post: 'Post', nota_prensa: 'Nota de prensa (borrador)', otra: 'Otra' } as const

export async function Narrativa({ hito, u }: TabProps) {
  const sb = await createClient()
  const puede = puedeEscribir(u.rol, 'narrativa')
  const [{ data: n }, { data: voceros }, { data: piezas }] = await Promise.all([
    sb.from('narrativas').select('*').eq('hito_id', hito.id).maybeSingle(),
    sb.from('voceros').select('id,nombre,cargo').order('nombre'),
    sb.from('piezas').select('*').eq('hito_id', hito.id).order('titulo'),
  ])
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg">Mensaje y vocero</h2>{n?.aprobada && <span className="chip-brand">Aprobada por el Head</span>}</div>
        <fieldset disabled={!puede}>
          <ActionForm action={guardarNarrativa.bind(null, hito.id)} autosave>
            <Field label="Mensaje clave" htmlFor="n-msg" hint="¿Qué contamos? Apóyate en una cifra validada."><textarea id="n-msg" name="mensaje_clave" rows={3} defaultValue={n?.mensaje_clave ?? ''} className="field" /></Field>
            <Field label="Vocero" htmlFor="n-voc">
              <select id="n-voc" name="vocero_id" defaultValue={n?.vocero_id ?? ''} className="field"><option value="">Sin vocero</option>{(voceros ?? []).map((v) => <option key={v.id} value={v.id}>{v.nombre}{v.cargo ? ` · ${v.cargo}` : ''}</option>)}</select>
            </Field>
            <Field label="Audiencia" htmlFor="n-aud"><input id="n-aud" name="audiencia" defaultValue={n?.audiencia ?? ''} className="field" placeholder="Founders, vendedores, prensa económica…" /></Field>
            <Field label="Momento de la vocería" htmlFor="n-mom"><input id="n-mom" name="momento" defaultValue={n?.momento ?? ''} className="field" placeholder="Charla del día 2, 11:00" /></Field>
            <Field label="Plan de medios previsto" htmlFor="n-pm"><textarea id="n-pm" name="plan_medios" rows={2} defaultValue={n?.plan_medios ?? ''} className="field" /></Field>
          </ActionForm>
        </fieldset>
      </section>
      <section className="card">
        <h2 className="mb-1 text-lg">Piezas</h2>
        <p className="mb-4 text-[13px] text-ink-muted">Charla, one-pager, post y nota de prensa en borrador. Se necesita al menos una para la compuerta.</p>
        <ul className="space-y-3">
          {(piezas ?? []).map((p) => (
            <li key={p.id} className="rounded-field border border-line p-3">
              <fieldset disabled={!puede}>
                <ActionForm action={estadoPieza.bind(null, hito.id, p.id)} autosave delay={800}>
                  <p className="text-[14px] font-medium">{p.titulo} <span className="text-ink-muted">· {TIPO_PIEZA[p.tipo as keyof typeof TIPO_PIEZA]}</span></p>
                  <div className="grid grid-cols-[150px_1fr] gap-2">
                    <select name="estado" aria-label="Estado" defaultValue={p.estado} className="field"><option value="pendiente">Pendiente</option><option value="borrador">Borrador</option><option value="aprobada">Aprobada</option></select>
                    <input name="url" aria-label="Enlace" defaultValue={p.url ?? ''} placeholder="Enlace al archivo" className="field" />
                  </div>
                </ActionForm>
              </fieldset>
              {puede && <ActionButton action={borrarPieza.bind(null, hito.id, p.id)} confirmar="¿Eliminar la pieza?" className="mt-1 text-[12px] text-ink-muted underline">Eliminar</ActionButton>}
            </li>
          ))}
          {(piezas ?? []).length === 0 && <li className="text-[14px] text-ink-muted">Aún no hay piezas.</li>}
        </ul>
        {puede && (
          <ActionForm action={agregarPieza.bind(null, hito.id)} submit="Agregar pieza" outline reset className="mt-4">
            <div className="grid grid-cols-[170px_1fr] gap-2">
              <select name="tipo" aria-label="Tipo" className="field">{Object.entries(TIPO_PIEZA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <input name="titulo" aria-label="Título" required placeholder="Título de la pieza" className="field" />
            </div>
          </ActionForm>
        )}
      </section>
    </div>
  )
}
