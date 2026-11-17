'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, ChartColumn, Database, Globe, House, Kanban, Settings, type LucideIcon } from 'lucide-react'
import { cn } from '@/components/ui'

const ICONOS: Record<string, LucideIcon> = {
  home: House, calendar: Calendar, kanban: Kanban, globe: Globe, database: Database, chart: ChartColumn, settings: Settings,
}
type Item = { href: string; label: string; icon: string }

const activo = (path: string, href: string) => path === href || path.startsWith(href + '/')

export function Sidebar({ items }: { items: Item[] }) {
  const path = usePathname()
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {items.map((i) => {
        const Icon = ICONOS[i.icon] ?? House
        const on = activo(path, i.href)
        return (
          <Link key={i.href} href={i.href} aria-current={on ? 'page' : undefined}
            className={cn('flex min-h-[44px] items-center gap-3 rounded-full px-4 text-[14px] font-medium transition',
              on ? 'border border-brand bg-[rgba(255,111,32,0.12)] text-ink' : 'text-ink-muted hover:bg-surface-muted hover:text-ink')}>
            <Icon size={18} strokeWidth={2} className={on ? 'text-brand-light' : ''} />
            {i.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomNav({ items }: { items: Item[] }) {
  const path = usePathname()
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-bg-deep/95 backdrop-blur md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((i) => {
        const Icon = ICONOS[i.icon] ?? House
        const on = activo(path, i.href)
        return (
          <Link key={i.href} href={i.href} aria-current={on ? 'page' : undefined}
            className={cn('flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
              on ? 'text-brand-light' : 'text-ink-muted')}>
            <Icon size={20} strokeWidth={2} />
            {i.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function MasMenu({ items }: { items: Item[] }) {
  if (items.length === 0) return null
  return (
    <details className="relative md:hidden">
      <summary className="btn-outline min-h-[44px] cursor-pointer list-none px-4">Más</summary>
      <div className="absolute right-0 z-40 mt-2 w-48 rounded-box border border-line bg-surface-raised p-2 shadow-xl">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="flex min-h-[44px] items-center rounded-field px-3 text-[14px] text-ink-soft hover:bg-surface-muted">{i.label}</Link>
        ))}
      </div>
    </details>
  )
}
