import type { Eje, Etapa, Hito, Pais, Usuario, Vertical } from '@/lib/types'

export interface TabProps {
  hito: Hito
  u: Usuario
  cat: {
    ejes: Eje[]; paises: Pais[]; etapas: Etapa[]; verticales: Vertical[]
    monedas: { codigo: string; cop_por_unidad: number; usd_por_unidad: number }[]
    umbrales: { verde: number; ambar: number }
  }
  tipo: { es_evento: boolean; usa_captura: boolean; es_social: boolean }
}
