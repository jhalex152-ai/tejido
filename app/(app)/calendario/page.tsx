import { requireStaff } from '@/lib/auth'
import { getCatalogos, listarPersonas } from '@/lib/data'
import { cargarCalendario } from '@/lib/calendario'
import { PageHeader } from '@/components/ui'
import { CalendarioView } from '@/components/calendario/calendario'

export default async function CalendarioPage() {
  await requireStaff()
  const [items, cat, personas] = await Promise.all([cargarCalendario(true), getCatalogos(), listarPersonas()])
  return (
    <>
      <PageHeader eyebrow="Calendario" title="Qué pasa, dónde y cuándo" />
      <CalendarioView items={items} enlazar conEtapa personas={personas} paises={cat.paises} ejes={cat.ejes} verticales={cat.verticales.map((v) => v.nombre)} />
    </>
  )
}
