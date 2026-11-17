import { createClient } from '@/lib/supabase/server'
import { ActionForm, ActionButton } from '@/components/forms/action-form'
import { Countdown } from '@/components/hitos/countdown'
import { puedeEscribir } from '@/lib/permisos'
import { fechaCorta } from '@/lib/fechas'
import { fmtNum } from '@/lib/kpis'
import { agregarPublicacion, borrarPublicacion } from '../../actions-captura'
import type { TabProps } from './tipos'

const TONO = { positivo: 'Positivo', neutral: 'Neutral', negativo: 'Negativo' } as const

export async function Medios({ hito, u, cat }: TabProps) {
  const sb = await createClient()
  const escribe = puedeEscribir(u.rol, 'medios')
  const { data: pubs } = await sb.from('publicaciones').select('*').eq('hito_id', hito.id).order('fecha')
  // La ventana empieza al terminar el día de fin (hora de Bogotá, UTC-5) y dura 48 h
  const finEvento = new Date(`${hito.fecha_fin}T00:00:00-05:00`)
  finEvento.setDate(finEvento.getDate() + 1)
  const limite = new Date(finEvento.getTime() + 48 * 3_600_000)
  const primera = (pubs ?? [])[0]
  const aTiempo = primera ? new Date(primera.fecha).getTime() <= limite.getTime() : null
  const ya = new Date() >= finEvento

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="card">
        <h2 className="mb-4 text-lg">Publicaciones</h2>
        <ul className="divide-y divide-line">
          {(pubs ?? []).map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0 text-[14px]">
                <p className="font-medium">{p.medio} <span className="chip ml-1">{p.tipo}</span> {p.pais_codigo && <span className="chip">{p.pais_codigo}</span>}</p>
                <p className="text-[12px] text-ink-muted">{fechaCorta(p.fecha)} · alcance {fmtNum(p.alcance)} · tono {p.tono ? TONO[p.tono as keyof typeof TONO] : '—'}{p.competidores?.length ? ` · menciona: ${p.competidores.join(', ')}` : ''}</p>
                {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="break-all text-[12px] text-brand-light underline">{p.url}</a>}
              </div>
              {escribe && <ActionButton action={borrarPublicacion.bind(null, hito.id, p.id)} confirmar="¿Eliminar la publicación?" className="text-[12px] text-ink-muted underline">Quitar</ActionButton>}
            </li>
          ))}
          {(pubs ?? []).length === 0 && <li className="py-3 text-[14px] text-ink-muted">Aún no hay publicaciones. Registra la primera en las 48 h posteriores al evento.</li>}
        </ul>
        {escribe && (
          <ActionForm action={agregarPublicacion.bind(null, hito.id)} submit="Registrar publicación" outline reset className="mt-5">
            <div className="grid gap-3 md:grid-cols-2">
              <input name="medio" required aria-label="Medio" placeholder="Medio (LinkedIn, Semana, Portafolio…)" className="field" />
              <select name="tipo" aria-label="Tipo" className="field"><option value="ganado">Ganado</option><option value="propio">Propio</option><option value="pagado">Pagado</option></select>
              <input name="url" type="url" aria-label="URL" placeholder="URL" className="field md:col-span-2" />
              <input name="fecha" type="datetime-local" aria-label="Fecha y hora" className="field" />
              <select name="pais_codigo" aria-label="País" className="field" defaultValue=""><option value="">País</option>{cat.paises.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}</select>
              <input name="alcance" inputMode="numeric" aria-label="Alcance" placeholder="Alcance" className="field" />
              <select name="tono" aria-label="Tono" className="field" defaultValue=""><option value="">Tono</option>{Object.entries(TONO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <input name="competidores" aria-label="Competidores mencionados" placeholder="Competidores mencionados (Mastershop, Rocketfy…)" className="field md:col-span-2" />
            </div>
          </ActionForm>
        )}
      </section>
      <aside className="card h-fit">
        <p className="eyebrow">Ventana de 48 h</p>
        <h2 className="mb-3 text-lg">Amplificación</h2>
        {ya ? <Countdown finISO={limite.toISOString()} publicada={aTiempo === true} />
          : <p className="text-[14px] text-ink-muted">La ventana empieza cuando termina el evento ({fechaCorta(hito.fecha_fin)}). Medios entra a la 4ª etapa: sin medios, el evento muere ese mismo día.</p>}
        {primera && aTiempo === false && <p className="mt-2 text-[13px] text-sem-amber">La primera publicación llegó fuera de las 48 h.</p>}
        <p className="mt-3 text-[12px] text-ink-faint">Si vence sin publicación, el hito pasa a ámbar y se avisa al transversal.</p>
      </aside>
    </div>
  )
}
