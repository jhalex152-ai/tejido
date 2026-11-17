// Fórmulas del PRD §6

const pct = (a: number, b: number) => (b > 0 ? a / b : null)

export interface Embudo {
  audienciaObjetivo: number | null
  metaLeads: number | null
  capturados: number
  calificados: number // A + B
  registros: number
  activados: number
}

export const tasaCaptura = (e: Embudo) => pct(e.capturados, e.audienciaObjetivo ?? 0)
export const tasaCalificacion = (e: Embudo) => pct(e.calificados, e.capturados)
export const cumplimientoMeta = (e: Embudo) => pct(e.calificados, e.metaLeads ?? 0)
export const activacion = (e: Embudo) => pct(e.activados, e.calificados)

/** Costo por lead calificado = costo real del hito × participación de la vertical / leads calificados */
export function costoPorLead(costoReal: number | null, calificados: number, participacion: number | null, nVerticales: number): number | null {
  if (costoReal == null || calificados <= 0) return null
  const parte = participacion ?? (nVerticales > 0 ? 1 / nVerticales : 1)
  return (costoReal * parte) / calificados
}

export type Color = 'verde' | 'ambar' | 'rojo'

/** Verde ≥ 90% de la meta, ámbar 60–89%, rojo < 60% (umbrales configurables) */
export function semaforoMeta(cumplimiento: number | null, umbrales = { verde: 90, ambar: 60 }): Color | null {
  if (cumplimiento == null) return null
  const p = cumplimiento * 100
  return p >= umbrales.verde ? 'verde' : p >= umbrales.ambar ? 'ambar' : 'rojo'
}

export function convertir(valor: number, de: string, a: 'COP' | 'USD', tasas: Record<string, { cop: number; usd: number }>): number | null {
  const t = tasas[de]
  if (!t) return null
  return a === 'COP' ? valor * t.cop : valor * t.usd
}

export const fmtPct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`)
export const fmtNum = (v: number | null | undefined) => (v == null ? '—' : new Intl.NumberFormat('es-CO').format(Math.round(v)))
export const fmtMoneda = (v: number | null | undefined, moneda = 'COP') =>
  v == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(v)
