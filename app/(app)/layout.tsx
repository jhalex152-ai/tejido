import Image from 'next/image'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { requireUsuario } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { NAV_POR_ROL } from '@/lib/permisos'
import { ROL_LABEL } from '@/lib/constants'
import { Avatar } from '@/components/ui'
import { BottomNav, MasMenu, Sidebar } from '@/components/shell/nav-links'

const MOVIL = ['/inicio', '/calendario', '/hitos', '/paises']

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUsuario()
  const supabase = await createClient()
  const { count } = await supabase.from('notificaciones').select('id', { count: 'exact', head: true }).eq('leida', false)
  const items = NAV_POR_ROL(u.rol)
  const principales = u.rol === 'consulta' ? items : items.filter((i) => MOVIL.includes(i.href))
  const resto = u.rol === 'consulta' ? [] : items.filter((i) => !MOVIL.includes(i.href))

  return (
    <div className="min-h-dvh bg-bg">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-bg-deep p-4 md:flex">
        <Link href={u.rol === 'consulta' ? '/consulta' : '/inicio'} className="mb-8 flex items-center gap-3 px-2">
          <Image src="/brand/isotipo.svg" alt="" width={32} height={32} unoptimized />
          <span className="text-lg font-bold tracking-tight">Tejido</span>
        </Link>
        <Sidebar items={items} />
        <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
          <Avatar nombre={u.nombre} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium">{u.nombre}</p>
            <p className="truncate text-[12px] text-ink-muted">{ROL_LABEL[u.rol]}</p>
          </div>
          <form action="/auth/signout" method="post"><button className="text-[12px] text-ink-muted underline hover:text-ink">Salir</button></form>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-bg/90 px-4 py-2 backdrop-blur md:justify-end md:px-8">
          <Link href="/inicio" className="flex items-center gap-2 md:hidden">
            <Image src="/brand/isotipo.svg" alt="" width={28} height={28} unoptimized />
            <span className="font-bold">Tejido</span>
          </Link>
          <div className="flex items-center gap-2">
            {u.rol !== 'consulta' && (
              <Link href="/notificaciones" aria-label={`Notificaciones${count ? `, ${count} sin leer` : ''}`}
                className="relative grid h-11 w-11 place-items-center rounded-full border border-line-strong hover:border-brand">
                <Bell size={18} />
                {!!count && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-bg">{count}</span>}
              </Link>
            )}
            <MasMenu items={resto} />
            <form action="/auth/signout" method="post" className="md:hidden"><button className="btn-outline px-4">Salir</button></form>
          </div>
        </header>
        <main className="px-4 pb-28 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>
      <BottomNav items={principales} />
    </div>
  )
}
