import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ActionForm, ActionButton } from '@/components/forms/action-form'
import { puedeEscribir } from '@/lib/permisos'
import { fechaCorta } from '@/lib/fechas'
import { desvincularCifra, vincularCifra } from '../../actions'
import type { TabProps } from './tipos'

interface Cifra { id: string; eje_id: number; pais_codigo: string | null; enunciado: string; valor: number | null; valor_texto: string | null; unidad: string | null; fuente: string; fecha_corte: string; vigente_hasta: string | null; estado: string }

export async function Datos({ hito, u, cat }: TabProps) {
  const sb = await createClient()
  const puede = puedeEscribir(u.rol, 'datos')
  const [{ data: vinc }, { data: todas }] = await Promise.all([
    sb.from('hito_cifras').select('cifra_id').eq('hito_id', hito.id),
    sb.from('cifras').select('*').order('fecha_corte', { ascending: false }),
  ])
  const ids = new Set((vinc ?? []).map((v) => v.cifra_id))
  const cifras = (todas ?? []) as Cifra[]
  const vinculadas = cifras.filter((c) => ids.has(c.id))
  const hoy = new Date().toISOString().slice(0, 10)
  const vigente = (c: Cifra) => c.estado === 'validada' && (!c.vigente_hasta || c.vigente_hasta >= hoy)
  const ejesHito = cat.ejes.filter((e) => e.id === hito.eje_id || hito.ejes_secundarios.includes(e.id))
  const disponibles = cifras.filter((c) => !ids.has(c.id) && ejesHito.some((e) => e.id === c.eje_id))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="card">
        <h2 className="mb-1 text-lg">Cifras para la vocería</h2>
        <p className="mb-4 text-[13px] text-ink-muted">Sin dato validado no hay narrativa. Datos marca cada cifra como “validada para vocería”.</p>
        {vinculadas.length === 0 ? (
          <p className="rounded-box border border-dashed border-line-strong p-6 text-center text-ink-muted">Aún no hay cifra validada. Pide una a Datos.</p>
        ) : (
          <ul className="space-y-3">
            {vinculadas.map((c) => (
              <li key={c.id} className="rounded-box border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-medium">{c.enunciado}</p>
                  <span className={vigente(c) ? 'chip-brand' : 'chip'}>{vigente(c) ? 'Validada' : c.estado === 'validada' ? 'Vencida' : c.estado}</span>
                </div>
                <p className="mt-1 text-[22px] font-bold tracking-tight text-brand-light">{c.valor != null ? new Intl.NumberFormat('es-CO').format(c.valor) : c.valor_texto} <span className="text-[14px] font-normal text-ink-muted">{c.unidad}</span></p>
                <p className="mt-1 text-[12px] text-ink-muted">Fuente: {c.fuente} · corte {fechaCorta(c.fecha_corte)}{c.vigente_hasta && ` · vigente hasta ${fechaCorta(c.vigente_hasta)}`}</p>
                {puede && <div className="mt-2"><ActionButton action={() => desvincularCifra(hito.id, c.id)} className="text-[12px] text-ink-muted underline">Desvincular</ActionButton></div>}
              </li>
            ))}
          </ul>
        )}
        {puede && disponibles.length > 0 && (
          <ActionForm action={(fd) => vincularCifra(hito.id, fd)} submit="Vincular cifra" outline reset className="mt-4">
            <label className="label" htmlFor="cifra-sel">Vincular una cifra de la biblioteca (de los ejes del hito)</label>
            <select id="cifra-sel" name="cifra_id" className="field" defaultValue="">
              <option value="" disabled>Elige una cifra</option>
              {disponibles.map((c) => <option key={c.id} value={c.id}>[{vigente(c) ? 'validada' : c.estado}] {c.enunciado.slice(0, 80)}</option>)}
            </select>
          </ActionForm>
        )}
      </section>

      <aside className="card h-fit">
        <h2 className="mb-3 text-lg">Requisito por eje</h2>
        <ul className="space-y-2">
          {ejesHito.map((e) => {
            const ok = vinculadas.some((c) => c.eje_id === e.id && vigente(c))
            return (
              <li key={e.id} className="flex items-center gap-2 text-[14px]">
                {ok ? <Check size={16} className="text-sem-green" /> : <X size={16} className="text-sem-amber" />}
                {e.nombre}: {ok ? 'tiene cifra validada' : 'falta 1 cifra validada'}
              </li>
            )
          })}
        </ul>
        <Link href="/datos" className="btn-outline mt-4 w-full">Abrir biblioteca de datos</Link>
      </aside>
    </div>
  )
}
