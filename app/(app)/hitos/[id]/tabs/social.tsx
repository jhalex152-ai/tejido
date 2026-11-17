import { createClient } from '@/lib/supabase/server'
import { ActionForm } from '@/components/forms/action-form'
import { SubirArchivo } from '@/components/forms/subir-archivo'
import { Field } from '@/components/ui'
import { puedeEscribir } from '@/lib/permisos'
import { guardarAccionSocial } from '../../actions-captura'
import { registrarArchivo } from '../../actions'
import type { TabProps } from './tipos'

export async function Social({ hito, u }: TabProps) {
  const sb = await createClient()
  const escribe = puedeEscribir(u.rol, 'social')
  const [{ data: a }, { data: aliados }] = await Promise.all([
    sb.from('acciones_sociales').select('*').eq('hito_id', hito.id).maybeSingle(),
    sb.from('aliados').select('id,nombre,tipo').order('nombre'),
  ])
  let acta: string | null = null
  if (a?.acta_path) acta = (await sb.storage.from('archivos').createSignedUrl(a.acta_path, 3600)).data?.signedUrl ?? null
  return (
    <section className="card max-w-3xl">
      <h2 className="mb-1 text-lg">Acción social</h2>
      <p className="mb-4 text-[13px] text-ink-muted">Fundación aliada, beneficiarios, equipos entregados y acta. El eje social se mide en alianzas RSE y beneficiarios, no en leads comerciales.</p>
      <fieldset disabled={!escribe}>
        <ActionForm action={(fd) => guardarAccionSocial(hito.id, fd)} autosave>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Fundación o aliado" htmlFor="as-al"><select id="as-al" name="aliado_id" defaultValue={a?.aliado_id ?? ''} className="field"><option value="">Sin definir</option>{(aliados ?? []).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></Field>
            <Field label="Tipo de acción" htmlFor="as-t"><input id="as-t" name="tipo" defaultValue={a?.tipo ?? ''} placeholder="Entrega, visita, alianza…" className="field" /></Field>
            <Field label="Beneficiarios" htmlFor="as-b"><input id="as-b" inputMode="numeric" name="beneficiarios" defaultValue={a?.beneficiarios ?? ''} className="field" /></Field>
            <Field label="Equipos entregados" htmlFor="as-e"><input id="as-e" inputMode="numeric" name="equipos_entregados" defaultValue={a?.equipos_entregados ?? ''} className="field" /></Field>
          </div>
        </ActionForm>
      </fieldset>
      {escribe && <div className="mt-4"><SubirArchivo hitoId={hito.id} carpeta="acta" etiqueta="Acta firmada y fotos (PDF o imagen)" registrar={registrarArchivo.bind(null, hito.id, 'acta')} /></div>}
      {acta && <a href={acta} target="_blank" rel="noreferrer" className="chip-brand mt-3 underline">Ver acta</a>}
      {(aliados ?? []).length === 0 && <p className="mt-3 text-[12px] text-ink-faint">El catálogo de fundaciones y aliados lo carga un administrador (fase 2 trae su pantalla propia).</p>}
    </section>
  )
}
