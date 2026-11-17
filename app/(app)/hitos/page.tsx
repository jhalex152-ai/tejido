import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireStaff } from '@/lib/auth'
import { getCatalogos, listarHitos } from '@/lib/data'
import { PageHeader } from '@/components/ui'
import { Kanban } from './kanban'

export default async function HitosPage() {
  const u = await requireStaff()
  const [hitos, cat] = await Promise.all([listarHitos(), getCatalogos()])
  const puedeCrear = ['admin', 'lider_eventos', 'marcom', 'lider_impacto'].includes(u.rol)
  return (
    <>
      <PageHeader eyebrow="Pipeline" title="Hitos">
        {puedeCrear && <Link href="/hitos/nuevo" className="btn-primary"><Plus size={16} />Nuevo hito</Link>}
      </PageHeader>
      <p className="mb-4 max-w-3xl text-[14px] text-ink-muted">
        Cada hito pasa por 8 etapas. Arrastra una tarjeta a la siguiente columna para aprobar su compuerta: si falta algo, la app te dice qué.
      </p>
      <p className="mb-4 hidden text-[13px] text-ink-faint md:block">
        Con el teclado: <kbd className="rounded border border-line-strong px-1.5">←</kbd> <kbd className="rounded border border-line-strong px-1.5">→</kbd> mueven el tablero de columna en columna y <kbd className="rounded border border-line-strong px-1.5">↑</kbd> <kbd className="rounded border border-line-strong px-1.5">↓</kbd> suben y bajan la página.
      </p>
      <Kanban hitos={hitos} etapas={cat.etapas} ejes={cat.ejes} paises={cat.paises} puedeMover={u.rol !== 'doer_eventos'} />
    </>
  )
}
