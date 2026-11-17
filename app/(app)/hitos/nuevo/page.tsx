import { requireStaff } from '@/lib/auth'
import { getCatalogos } from '@/lib/data'
import { PageHeader } from '@/components/ui'
import { redirect } from 'next/navigation'
import { NuevoHitoForm } from './form'

export default async function NuevoHito() {
  const u = await requireStaff()
  if (!['admin', 'lider_eventos', 'marcom', 'lider_impacto'].includes(u.rol)) redirect('/hitos')
  const cat = await getCatalogos()
  return (
    <>
      <PageHeader eyebrow="Radar" title="Nuevo hito" />
      <NuevoHitoForm ejes={cat.ejes} paises={cat.paises} monedas={cat.monedas.map((m) => m.codigo)} soloSocial={u.rol === 'lider_impacto'} />
    </>
  )
}
