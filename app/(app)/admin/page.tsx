import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getCatalogos } from '@/lib/data'
import { ActionForm, ActionButton } from '@/components/forms/action-form'
import { Field, PageHeader, cn } from '@/components/ui'
import { NOMBRE_ETAPA, PRIORIDAD_LABEL, ROL_LABEL, TIPO_LABEL } from '@/lib/constants'
import { fechaCorta } from '@/lib/fechas'
import {
  actualizarPais, actualizarUsuario, agregarPlantilla, borrarMeta, borrarPlantilla, borrarVocero, guardarMeta, guardarMoneda,
  guardarUmbrales, guardarVerticalCatalogo, guardarVocero, invitar, quitarInvitacion,
} from './actions'
import type { Rol } from '@/lib/types'

const SECCIONES = [
  ['usuarios', 'Usuarios'], ['paises', 'Países'], ['verticales', 'Verticales'], ['voceros', 'Voceros'], ['monedas', 'Monedas'],
  ['umbrales', 'Umbrales y metas'], ['plantillas', 'Plantillas'], ['auditoria', 'Auditoría'],
] as const

const RolSelect = ({ name, def }: { name: string; def?: string }) => (
  <select name={name} aria-label="Rol" defaultValue={def} className="field">{(Object.keys(ROL_LABEL) as Rol[]).map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}</select>
)

export default async function Admin({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const u = await requireAdmin()
  const { s = 'usuarios' } = await searchParams
  const sb = await createClient()
  const cat = await getCatalogos()

  return (
    <>
      <PageHeader eyebrow="Administración" title="Usuarios y catálogos" />
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Secciones">
        {SECCIONES.map(([k, t]) => (
          <Link key={k} href={`/admin?s=${k}`} aria-current={s === k ? 'page' : undefined}
            className={cn('min-h-[44px] shrink-0 border-b-2 px-4 py-3 text-[14px] font-medium', s === k ? 'border-brand text-ink' : 'border-transparent text-ink-muted hover:text-ink')}>{t}</Link>
        ))}
      </nav>

      {s === 'usuarios' && await (async () => {
        const [{ data: perfiles }, { data: invs }] = await Promise.all([
          sb.from('profiles').select('id,nombre,email,rol,activo').order('nombre'),
          sb.from('invitaciones').select('*').is('aceptada_en', null).order('creado_en', { ascending: false }),
        ])
        return (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="space-y-3">
              {(perfiles ?? []).map((p) => (
                <div key={p.id} className="card !p-4">
                  <ActionForm action={(fd) => actualizarUsuario(p.id, fd)} submit="Guardar" outline>
                    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{p.nombre}{p.id === u.id && <span className="ml-2 chip-brand">tú</span>}</p><p className="text-[13px] text-ink-muted">{p.email}</p></div>
                      <label className="flex min-h-[44px] items-center gap-2 text-[14px]"><input type="checkbox" name="activo" defaultChecked={p.activo} className="h-5 w-5 accent-[#FF6F20]" />Activo</label></div>
                    <div className="grid gap-3 md:grid-cols-[240px_1fr]"><RolSelect name="rol" def={p.rol} /><input name="motivo" required aria-label="Motivo del cambio" placeholder="Motivo del cambio (queda en el log)" className="field" /></div>
                  </ActionForm>
                </div>
              ))}
            </section>
            <aside className="space-y-6">
              <section className="card"><h2 className="mb-3 text-lg">Invitar a alguien</h2>
                <p className="mb-3 text-[13px] text-ink-muted">Solo entra quien esté invitado. Sin registro abierto.</p>
                <ActionForm action={invitar} submit="Invitar" reset>
                  <Field label="Correo" htmlFor="inv-e"><input id="inv-e" type="email" name="email" required className="field" /></Field>
                  <Field label="Nombre" htmlFor="inv-n"><input id="inv-n" name="nombre" className="field" /></Field>
                  <Field label="Rol" htmlFor="inv-r"><RolSelect name="rol" def="consulta" /></Field>
                </ActionForm></section>
              <section className="card"><h2 className="mb-3 text-lg">Invitaciones pendientes</h2>
                <ul className="space-y-2 text-[14px]">{(invs ?? []).map((i) => (
                  <li key={i.email} className="flex items-center justify-between gap-2"><span>{i.email}<span className="block text-[12px] text-ink-muted">{ROL_LABEL[i.rol as Rol]}</span></span>
                    <ActionButton action={() => quitarInvitacion(i.email)} className="text-[12px] text-ink-muted underline">Quitar</ActionButton></li>))}
                  {(invs ?? []).length === 0 && <li className="text-ink-muted">Ninguna.</li>}</ul></section>
            </aside>
          </div>
        )
      })()}

      {s === 'paises' && (
        <section className="space-y-3">
          <p className="max-w-3xl text-[14px] text-ink-muted">La prioridad es la propuesta del brief del área. Edítala aquí junto con moneda, zona horaria y contacto local de eventos.</p>
          {cat.paises.map((p) => (
            <div key={p.codigo} className="card !p-4">
              <ActionForm action={(fd) => actualizarPais(p.codigo, fd)} submit="Guardar" outline>
                <p className="font-semibold">{p.nombre} <span className="text-[13px] font-normal text-ink-muted">{p.codigo} · {p.marca} · {p.region}</span></p>
                <div className="grid gap-3 md:grid-cols-5">
                  <select name="prioridad" aria-label="Prioridad" defaultValue={p.prioridad} className="field">{Object.entries(PRIORIDAD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  <input name="estado" aria-label="Estado" defaultValue={p.estado} className="field" />
                  <select name="moneda" aria-label="Moneda" defaultValue={p.moneda} className="field">{cat.monedas.map((m) => <option key={m.codigo}>{m.codigo}</option>)}</select>
                  <input name="zona_horaria" aria-label="Zona horaria" defaultValue={p.zona_horaria} className="field" />
                  <input name="contacto_local" aria-label="Contacto local de eventos" defaultValue={p.contacto_local ?? ''} placeholder="Contacto local" className="field" />
                </div>
              </ActionForm>
            </div>
          ))}
        </section>
      )}

      {s === 'verticales' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="space-y-3">
            {cat.verticales.map((v) => (
              <div key={v.id} className="card !p-4"><p className="font-semibold">{v.nombre} <span className="chip ml-1">{v.codigo}</span></p>
                <p className="text-[13px] text-ink-muted">Responsable: {v.responsable ?? 'sin definir'}</p>
                {Object.keys(v.reglas_calificacion).length > 0 ? <ul className="mt-1 text-[13px] text-ink-soft">{Object.entries(v.reglas_calificacion).map(([k, t]) => <li key={k}><b>{k}</b> = {t}</li>)}</ul> : <p className="mt-1 text-[13px] text-ink-faint">Sin reglas A/B/C todavía.</p>}</div>))}
          </section>
          <aside className="card h-fit"><h2 className="mb-1 text-lg">Agregar o actualizar vertical</h2><p className="mb-3 text-[13px] text-ink-muted">El catálogo es editable: Dropi habla de +12. Si el nombre ya existe, se actualiza.</p>
            <ActionForm action={guardarVerticalCatalogo} submit="Guardar vertical" reset>
              <Field label="Nombre" htmlFor="v-n"><input id="v-n" name="nombre" required className="field" /></Field>
              <Field label="Código de 4 letras" htmlFor="v-c" hint="Va en el código de evento: DESP26-ROAX"><input id="v-c" name="codigo" maxLength={4} required className="field uppercase" /></Field>
              <Field label="Responsable" htmlFor="v-r"><input id="v-r" name="responsable" className="field" /></Field>
              <Field label="Reglas A/B/C (JSON)" htmlFor="v-j"><textarea id="v-j" name="reglas" rows={3} className="field font-mono text-[12px]" placeholder='{"A":"Ya vende en línea","B":"Quiere empezar","C":"Curiosidad"}' /></Field>
            </ActionForm></aside>
        </div>
      )}

      {s === 'voceros' && await (async () => {
        const { data } = await sb.from('voceros').select('*').order('nombre')
        return (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="space-y-2">{(data ?? []).map((v) => (
              <div key={v.id} className="card !p-4 flex items-center justify-between gap-3"><div><p className="font-semibold">{v.nombre}</p><p className="text-[13px] text-ink-muted">{v.cargo} {v.temas?.length ? `· ${v.temas.join(', ')}` : ''}</p></div>
                <ActionButton action={() => borrarVocero(v.id)} confirmar="¿Eliminar el vocero?" className="text-[12px] text-ink-muted underline">Quitar</ActionButton></div>))}
              {(data ?? []).length === 0 && <p className="text-ink-muted">Aún no hay voceros: agrega al primero para poder asignarlo a una narrativa.</p>}</section>
            <aside className="card h-fit"><h2 className="mb-3 text-lg">Nuevo vocero</h2>
              <ActionForm action={guardarVocero} submit="Agregar" reset>
                <Field label="Nombre" htmlFor="vo-n"><input id="vo-n" name="nombre" required className="field" /></Field>
                <Field label="Cargo" htmlFor="vo-c"><input id="vo-c" name="cargo" className="field" /></Field>
                <Field label="Temas (separados por coma)" htmlFor="vo-t"><input id="vo-t" name="temas" className="field" placeholder="IA, fintech, dropshipping" /></Field>
              </ActionForm></aside>
          </div>
        )
      })()}

      {s === 'monedas' && (
        <section className="space-y-3">
          <p className="max-w-3xl text-[14px] text-ink-muted">Tasas para convertir los costos a COP y USD en el tablero. Los valores iniciales son <b>referenciales</b>: actualízalos.</p>
          {cat.monedas.map((m) => (
            <div key={m.codigo} className="card !p-4"><ActionForm action={(fd) => guardarMoneda(m.codigo, fd)} submit="Guardar" outline>
              <div className="grid items-end gap-3 md:grid-cols-[80px_1fr_1fr]"><p className="pb-3 text-lg font-bold">{m.codigo}</p>
                <Field label="COP por 1 unidad" htmlFor={`m-c-${m.codigo}`}><input id={`m-c-${m.codigo}`} name="cop_por_unidad" defaultValue={String(m.cop_por_unidad).replace('.', ',')} className="field" /></Field>
                <Field label="USD por 1 unidad" htmlFor={`m-u-${m.codigo}`}><input id={`m-u-${m.codigo}`} name="usd_por_unidad" defaultValue={String(m.usd_por_unidad).replace('.', ',')} className="field" /></Field></div>
            </ActionForm></div>))}
        </section>
      )}

      {s === 'umbrales' && await (async () => {
        const { data: metas } = await sb.from('kpi_metas').select('*').order('trimestre', { ascending: false })
        return (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card h-fit"><h2 className="mb-1 text-lg">Semáforo trimestral</h2><p className="mb-3 text-[13px] text-ink-muted">Porcentaje de la meta de leads calificados. Verde ≥ umbral verde; ámbar ≥ umbral ámbar; rojo por debajo.</p>
              <ActionForm action={guardarUmbrales} submit="Guardar umbrales">
                <div className="grid grid-cols-2 gap-3"><Field label="Verde (≥ %)" htmlFor="u-v"><input id="u-v" name="verde" defaultValue={cat.umbrales.verde} inputMode="numeric" className="field" /></Field>
                  <Field label="Ámbar (≥ %)" htmlFor="u-a"><input id="u-a" name="ambar" defaultValue={cat.umbrales.ambar} inputMode="numeric" className="field" /></Field></div>
              </ActionForm></section>
            <section className="card"><h2 className="mb-1 text-lg">Metas trimestrales</h2><p className="mb-3 text-[13px] text-ink-muted">Por movilizador, eje, vertical o país (pendiente de definir para 2027).</p>
              <ul className="mb-4 space-y-1.5 text-[14px]">{(metas ?? []).map((m) => <li key={m.id} className="flex items-center justify-between rounded-field border border-line px-3 py-2"><span>{m.trimestre} · {m.nivel} · {m.clave}: <b>{m.meta}</b></span><ActionButton action={() => borrarMeta(m.id)} className="text-[12px] text-ink-muted underline">Quitar</ActionButton></li>)}</ul>
              <ActionForm action={guardarMeta} submit="Guardar meta" outline reset>
                <div className="grid grid-cols-2 gap-2"><input name="trimestre" aria-label="Trimestre" placeholder="2027-Q1" className="field" />
                  <select name="nivel" aria-label="Nivel" className="field"><option value="movilizador">Movilizador</option><option value="eje">Eje</option><option value="vertical">Vertical</option><option value="pais">País</option></select>
                  <input name="clave" aria-label="Clave" placeholder="roax, CO, ecommerce…" className="field" /><input name="meta" aria-label="Meta" inputMode="decimal" placeholder="Meta" className="field" /></div>
              </ActionForm></section>
          </div>
        )
      })()}

      {s === 'plantillas' && await (async () => {
        const { data } = await sb.from('plantillas_entregables').select('*').order('etapa_id').order('orden')
        return (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="space-y-2">
              <p className="max-w-3xl text-[14px] text-ink-muted">Entregables adicionales por tipo de hito y etapa. Los obligatorios bloquean la compuerta. Aplican a los hitos nuevos.</p>
              {(data ?? []).map((p) => (
                <div key={p.id} className="card !p-3 flex items-center justify-between gap-3"><div><p className="text-[14px] font-medium">{p.nombre}{p.obligatorio && <span className="ml-1 text-brand-light">*</span>}</p>
                  <p className="text-[12px] text-ink-muted">{NOMBRE_ETAPA[p.etapa_id]} · {p.tipo_hito ? TIPO_LABEL[p.tipo_hito as keyof typeof TIPO_LABEL] : 'Todos los tipos'}</p></div>
                  <ActionButton action={() => borrarPlantilla(p.id)} confirmar="¿Quitar de la plantilla?" className="text-[12px] text-ink-muted underline">Quitar</ActionButton></div>))}
            </section>
            <aside className="card h-fit"><h2 className="mb-3 text-lg">Nuevo entregable</h2>
              <ActionForm action={agregarPlantilla} submit="Agregar" reset>
                <Field label="Nombre" htmlFor="pl-n"><input id="pl-n" name="nombre" required className="field" /></Field>
                <Field label="Etapa" htmlFor="pl-e"><select id="pl-e" name="etapa_id" className="field">{Object.entries(NOMBRE_ETAPA).map(([k, v]) => <option key={k} value={k}>{k}. {v}</option>)}</select></Field>
                <Field label="Tipo de hito" htmlFor="pl-t"><select id="pl-t" name="tipo_hito" className="field" defaultValue=""><option value="">Todos</option>{Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
                <label className="flex min-h-[44px] items-center gap-2 text-[14px]"><input type="checkbox" name="obligatorio" defaultChecked className="h-5 w-5 accent-[#FF6F20]" />Obligatorio para la compuerta</label>
              </ActionForm></aside>
          </div>
        )
      })()}

      {s === 'auditoria' && await (async () => {
        const { data } = await sb.from('actividad').select('id,accion,entidad,motivo,creado_en,hito_id,profiles:user_id(nombre)').order('creado_en', { ascending: false }).limit(80)
        const filas = (data ?? []) as unknown as { id: number; accion: string; entidad: string; motivo: string | null; creado_en: string; hito_id: string | null; profiles: { nombre: string } | null }[]
        return (
          <section className="card"><h2 className="mb-1 text-lg">Log de auditoría</h2><p className="mb-3 text-[13px] text-ink-muted">Cambios de etapa, aprobaciones, forzados, borrados y cambios de rol. Solo inserción: nadie puede editarlo.</p>
            <ul className="divide-y divide-line">{filas.map((f) => (
              <li key={f.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-[14px]"><span><b>{f.accion}</b>{f.motivo && <span className="text-ink-muted"> · {f.motivo}</span>}{f.hito_id && <Link href={`/hitos/${f.hito_id}`} className="ml-2 text-[12px] text-brand-light underline">hito</Link>}</span>
                <span className="text-[12px] text-ink-muted">{f.profiles?.nombre ?? 'Sistema'} · {fechaCorta(f.creado_en)}</span></li>))}</ul></section>
        )
      })()}
    </>
  )
}
