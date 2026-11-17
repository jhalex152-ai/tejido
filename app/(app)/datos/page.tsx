import { requireStaff } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCatalogos } from '@/lib/data'
import { redirect } from 'next/navigation'
import { ActionForm, ActionButton } from '@/components/forms/action-form'
import { Empty, EjeChip, Field, PageHeader } from '@/components/ui'
import { puedeEscribir, puedeLeer } from '@/lib/permisos'
import { fechaCorta } from '@/lib/fechas'
import { borrarCifra, crearCifra, estadoCifra } from './actions'

export default async function BibliotecaDatos({ searchParams }: { searchParams: Promise<{ eje?: string; pais?: string }> }) {
  const u = await requireStaff()
  if (!puedeLeer(u.rol, 'datos')) redirect('/inicio')
  const { eje, pais } = await searchParams
  const sb = await createClient()
  const cat = await getCatalogos()
  let q = sb.from('cifras').select('*').order('fecha_corte', { ascending: false })
  if (eje) q = q.eq('eje_id', Number(eje))
  if (pais) q = q.eq('pais_codigo', pais)
  const { data } = await q
  const puede = puedeEscribir(u.rol, 'datos')
  const hoy = new Date().toISOString().slice(0, 10)

  return (
    <>
      <PageHeader eyebrow="Movilizador 1 · Datos" title="Biblioteca de datos" />
      <p className="mb-5 max-w-3xl text-[14px] text-ink-muted">Cifras listas para vocería, por eje y país. Solo las <b>validadas y vigentes</b> abren la compuerta de Narrativa.</p>

      <form className="mb-5 flex flex-wrap items-end gap-3">
        <div><label className="label" htmlFor="fe">Eje</label><select id="fe" name="eje" defaultValue={eje ?? ''} className="field w-52"><option value="">Todos</option>{cat.ejes.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></div>
        <div><label className="label" htmlFor="fp">País</label><select id="fp" name="pais" defaultValue={pais ?? ''} className="field w-52"><option value="">Todos</option>{cat.paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}</select></div>
        <button className="btn-outline">Filtrar</button>
      </form>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section>
          {(data ?? []).length === 0 ? <Empty title="Aún no hay cifras. Datos las crea y las valida aquí." /> : (
            <ul className="space-y-3">
              {data!.map((c) => {
                const vencida = c.estado === 'vencida' || (c.estado === 'validada' && c.vigente_hasta && c.vigente_hasta < hoy)
                const e = cat.ejes.find((x) => x.id === c.eje_id)
                return (
                  <li key={c.id} className="card !p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="max-w-xl text-[15px] font-medium">{c.enunciado}</p>
                      <div className="flex gap-1.5">{e && <EjeChip nombre={e.nombre} color={e.color} />}{c.pais_codigo && <span className="chip">{c.pais_codigo}</span>}
                        <span className={vencida ? 'chip text-sem-amber' : c.estado === 'validada' ? 'chip-brand' : 'chip'}>{vencida ? 'Vencida' : c.estado}</span></div>
                    </div>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-brand-light">{c.valor != null ? new Intl.NumberFormat('es-CO').format(c.valor) : c.valor_texto} <span className="text-[14px] font-normal text-ink-muted">{c.unidad}</span></p>
                    <p className="text-[12px] text-ink-muted">Fuente: {c.fuente} · corte {fechaCorta(c.fecha_corte)}{c.vigente_hasta && ` · vigente hasta ${fechaCorta(c.vigente_hasta)}`}</p>
                    {puede && (
                      <ActionForm action={(fd) => estadoCifra(c.id, fd)} autosave delay={600} className="mt-3">
                        <div className="grid grid-cols-2 gap-2 md:w-96">
                          <select name="estado" aria-label="Estado" defaultValue={c.estado === 'vencida' ? 'borrador' : c.estado} className="field"><option value="borrador">Borrador</option><option value="validada">Validada para vocería</option></select>
                          <input type="date" name="vigente_hasta" aria-label="Vigente hasta" defaultValue={c.vigente_hasta ?? ''} className="field" />
                        </div>
                      </ActionForm>
                    )}
                    {puede && <div className="mt-1"><ActionButton action={() => borrarCifra(c.id)} confirmar="¿Eliminar la cifra? Se desvincula de los hitos." className="text-[12px] text-ink-muted underline">Eliminar</ActionButton></div>}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {puede && (
          <aside className="card h-fit">
            <h2 className="mb-3 text-lg">Nueva cifra</h2>
            <ActionForm action={crearCifra} submit="Crear cifra" reset>
              <Field label="Enunciado *" htmlFor="c-en"><textarea id="c-en" name="enunciado" rows={2} required className="field" placeholder="El 80% del e-commerce en la región es contraentrega" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor" htmlFor="c-v"><input id="c-v" name="valor" inputMode="decimal" className="field" /></Field>
                <Field label="Unidad" htmlFor="c-u"><input id="c-u" name="unidad" className="field" placeholder="%, USD, vendedores…" /></Field>
              </div>
              <Field label="Eje *" htmlFor="c-e"><select id="c-e" name="eje_id" className="field">{cat.ejes.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></Field>
              <Field label="País (vacío = regional)" htmlFor="c-p"><select id="c-p" name="pais_codigo" className="field" defaultValue=""><option value="">Todos / regional</option>{cat.paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}</select></Field>
              <Field label="Fuente *" htmlFor="c-f"><input id="c-f" name="fuente" required className="field" placeholder="Base interna Dropi, informe…" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha de corte *" htmlFor="c-fc"><input id="c-fc" type="date" name="fecha_corte" required className="field" /></Field>
                <Field label="Vigente hasta" htmlFor="c-vh"><input id="c-vh" type="date" name="vigente_hasta" className="field" /></Field>
              </div>
              <Field label="Estado" htmlFor="c-es"><select id="c-es" name="estado" className="field"><option value="borrador">Borrador</option><option value="validada">Validada para vocería</option></select></Field>
            </ActionForm>
          </aside>
        )}
      </div>
    </>
  )
}
