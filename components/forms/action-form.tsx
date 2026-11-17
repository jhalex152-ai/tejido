'use client'
import { useRef, useState, useTransition } from 'react'
import { cn } from '@/components/ui'
import type { Resultado } from '@/lib/types'

type Accion = (fd: FormData) => Promise<Resultado | void>

function Mensaje({ r }: { r: Resultado | null }) {
  if (!r) return null
  if (r.ok) return <p role="status" className="text-[13px] text-sem-green">{r.mensaje ?? 'Guardado'}</p>
  return (
    <div role="alert" className="rounded-field border border-sem-red/40 bg-sem-red/10 p-3 text-[13px] text-sem-red">
      <p className="font-medium">{r.error}</p>
      {r.faltantes && r.faltantes.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-ink-soft">{r.faltantes.map((f) => <li key={f}>{f}</li>)}</ul>
      )}
    </div>
  )
}

/** Formulario con Server Action. `autosave` guarda solo, unos segundos después de dejar de escribir. */
export function ActionForm({
  action, children, autosave = false, submit = 'Guardar', reset = false, className, delay = 1500, outline = false,
}: {
  action: Accion; children: React.ReactNode; autosave?: boolean; submit?: string | null; reset?: boolean
  className?: string; delay?: number; outline?: boolean
}) {
  const ref = useRef<HTMLFormElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(null)
  const [res, setRes] = useState<Resultado | null>(null)
  const [pending, start] = useTransition()

  function enviar(form: HTMLFormElement) {
    const fd = new FormData(form)
    start(async () => {
      const r = await action(fd)
      setRes(r ?? { ok: true })
      if (r?.ok !== false && reset) form.reset()
    })
  }

  return (
    <form
      ref={ref}
      className={cn('space-y-3', className)}
      onSubmit={(e) => { e.preventDefault(); enviar(e.currentTarget) }}
      onChange={() => {
        if (!autosave) return
        if (timer.current) clearTimeout(timer.current)
        setRes(null)
        timer.current = setTimeout(() => ref.current && enviar(ref.current), delay)
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        {submit !== null && !autosave && (
          <button type="submit" disabled={pending} className={outline ? 'btn-outline' : 'btn-primary'}>
            {pending ? 'Guardando…' : submit}
          </button>
        )}
        {autosave && <span className="text-[12px] text-ink-faint" aria-live="polite">{pending ? 'Guardando…' : res?.ok ? '✓ Guardado' : 'Se guarda solo'}</span>}
        {!(autosave && res?.ok) && <Mensaje r={res} />}
      </div>
      {autosave && res && !res.ok && <Mensaje r={res} />}
    </form>
  )
}

/** Botón de una sola acción (borrar, quitar…) con confirmación opcional */
export function ActionButton({
  action, children, confirmar, className = 'btn-outline', title,
}: { action: () => Promise<Resultado | void>; children: React.ReactNode; confirmar?: string; className?: string; title?: string }) {
  const [res, setRes] = useState<Resultado | null>(null)
  const [pending, start] = useTransition()
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" title={title} disabled={pending} className={className}
        onClick={() => {
          if (confirmar && !window.confirm(confirmar)) return
          start(async () => { const r = await action(); setRes(r ?? null) })
        }}>
        {pending ? '…' : children}
      </button>
      {res && !res.ok && <Mensaje r={res} />}
    </span>
  )
}

/** Casilla que guarda al marcarla (checklist, entregables) */
export function CheckAuto({ action, defecto, label, name = 'completo' }: { action: Accion; defecto: boolean; label: React.ReactNode; name?: string }) {
  return (
    <ActionForm action={action} autosave delay={200} className="!space-y-0">
      <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
        <input type="checkbox" name={name} defaultChecked={defecto} className="h-5 w-5 accent-[#FF6F20]" />
        <span className="text-[14px]">{label}</span>
      </label>
    </ActionForm>
  )
}
