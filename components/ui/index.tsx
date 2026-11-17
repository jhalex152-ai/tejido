import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Database, MessageCircle, Users, Send, type LucideIcon } from 'lucide-react'
import type { Semaforo } from '@/lib/types'

export const cn = (...v: ClassValue[]) => twMerge(clsx(v))

export const ICONOS: Record<string, LucideIcon> = {
  database: Database, 'message-circle': MessageCircle, users: Users, send: Send,
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-2xl md:text-3xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function Empty({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-box border border-dashed border-line-strong p-8 text-center">
      <p className="text-ink-muted">{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

const SEM: Record<Semaforo, { c: string; t: string }> = {
  verde: { c: 'bg-sem-green', t: 'En tiempo' },
  ambar: { c: 'bg-sem-amber', t: 'Compuerta vencida' },
  rojo: { c: 'bg-sem-red', t: 'Vencida y faltan menos de 7 días' },
}
export function SemaforoDot({ valor, label }: { valor: Semaforo; label?: boolean }) {
  const s = SEM[valor]
  return (
    <span className="inline-flex items-center gap-1.5" title={s.t}>
      <span className={cn('h-2.5 w-2.5 rounded-full', s.c)} aria-hidden />
      {label ? <span className="text-[12px] text-ink-soft">{s.t}</span> : <span className="sr-only">{s.t}</span>}
    </span>
  )
}

export function EjeChip({ nombre, color }: { nombre: string; color?: string }) {
  return (
    <span className="chip-brand" style={color ? { color, borderColor: color + '59', background: color + '1F' } : undefined}>
      {nombre}
    </span>
  )
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-ink-faint">{hint}</p>}
    </div>
  )
}

export function Avatar({ nombre }: { nombre: string }) {
  const ini = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-gradient text-[13px] font-bold text-bg shadow-glow" aria-hidden>
      {ini}
    </span>
  )
}
