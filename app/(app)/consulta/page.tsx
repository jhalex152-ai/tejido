import { requireUsuario } from '@/lib/auth'
import { getCatalogos } from '@/lib/data'
import { cargarCalendario } from '@/lib/calendario'
import { PageHeader } from '@/components/ui'
import { CalendarioView } from '@/components/calendario/calendario'

// Vista del perfil Consulta (líderes de verticales, directivos y otras áreas):
// nombre, fechas, país, ciudad, venue, eje, estado y verticales participantes. Sin costos, resultados ni notas.
export default async function Consulta() {
  await requireUsuario()
  const [items, cat] = await Promise.all([cargarCalendario(false), getCatalogos()])
  return (
    <>
      <PageHeader eyebrow="Consulta" title="Dónde estará Dropi" />
      <p className="mb-5 max-w-3xl text-[14px] text-ink-muted">Calendario de hitos del área de PR, Ecosistema y Eventos. Filtra por vertical para ver en qué eventos estará la tuya.</p>
      <CalendarioView items={items} enlazar={false} paises={cat.paises} ejes={cat.ejes} verticales={cat.verticales.map((v) => v.nombre)} />
    </>
  )
}
