import { describe, expect, it } from 'vitest'
import { activacion, costoPorLead, cumplimientoMeta, semaforoMeta, tasaCalificacion, tasaCaptura, convertir } from '@/lib/kpis'
import { rangoFechas, limitesTrimestre, trimestreDe } from '@/lib/fechas'
import { puntosProgreso } from '@/lib/progreso'

describe('fórmulas de medición (PRD §6)', () => {
  // Ejemplo del PRD: 100.000 asistentes, audiencia Proveedores 2.000, 400 capturados, 180 calificados
  const e = { audienciaObjetivo: 2000, metaLeads: 150, capturados: 400, calificados: 180, registros: 120, activados: 45 }
  it('tasa de captura 20% y de calificación 45%; los 100.000 no entran', () => {
    expect(tasaCaptura(e)).toBeCloseTo(0.2)
    expect(tasaCalificacion(e)).toBeCloseTo(0.45)
  })
  it('cumplimiento de meta y activación', () => {
    expect(cumplimientoMeta(e)).toBeCloseTo(1.2)
    expect(activacion(e)).toBeCloseTo(0.25)
  })
  it('sin denominador devuelve null y no NaN', () => {
    expect(tasaCaptura({ ...e, audienciaObjetivo: null })).toBeNull()
    expect(tasaCalificacion({ ...e, capturados: 0 })).toBeNull()
  })
  it('costo por lead reparte por participación o en partes iguales', () => {
    expect(costoPorLead(9_000_000, 180, 0.5, 2)).toBe(25_000)
    expect(costoPorLead(9_000_000, 180, null, 3)).toBeCloseTo(16_666.67, 1)
    expect(costoPorLead(null, 180, null, 1)).toBeNull()
    expect(costoPorLead(1000, 0, null, 1)).toBeNull()
  })
  it('semáforo: verde ≥ 90%, ámbar 60–89%, rojo < 60%', () => {
    expect(semaforoMeta(0.9)).toBe('verde')
    expect(semaforoMeta(0.89)).toBe('ambar')
    expect(semaforoMeta(0.6)).toBe('ambar')
    expect(semaforoMeta(0.59)).toBe('rojo')
    expect(semaforoMeta(null)).toBeNull()
    expect(semaforoMeta(0.7, { verde: 80, ambar: 50 })).toBe('ambar')
  })
  it('convierte monedas a COP y USD', () => {
    const tasas = { MXN: { cop: 220, usd: 0.055 } }
    expect(convertir(1000, 'MXN', 'COP', tasas)).toBe(220_000)
    expect(convertir(1000, 'MXN', 'USD', tasas)).toBeCloseTo(55)
    expect(convertir(1, 'XXX', 'USD', tasas)).toBeNull()
  })
})

describe('fechas y progreso', () => {
  it('formato "13–15 nov"', () => {
    expect(rangoFechas('2026-11-13', '2026-11-15')).toBe('13–15 nov')
    expect(rangoFechas('2026-10-24', '2026-10-24')).toBe('24 oct')
    expect(rangoFechas('2026-11-30', '2026-12-02')).toBe('30 nov – 2 dic')
  })
  it('trimestres', () => {
    expect(trimestreDe('2026-11-13')).toBe('2026-Q4')
    expect(limitesTrimestre('2026-Q4')).toEqual({ ini: '2026-10-01', fin: '2026-12-31' })
  })
  it('4 puntos de progreso y etapas omitidas', () => {
    const etapas = [
      { etapa_id: 2, estado: 'aprobada' as const, vence_en: null },
      { etapa_id: 3, estado: 'abierta' as const, vence_en: null },
      { etapa_id: 4, estado: 'omitida' as const, vence_en: null },
      { etapa_id: 5, estado: 'omitida' as const, vence_en: null },
      { etapa_id: 6, estado: 'pendiente' as const, vence_en: null },
    ]
    expect(puntosProgreso(etapas).map((p) => p.estado)).toEqual(['hecho', 'actual', 'omitido', 'pendiente'])
  })
})
