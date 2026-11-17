import { describe, expect, it } from 'vitest'
import { codigoEvento, construirCanal, slugBase, slugify } from '@/lib/utm'

describe('convención UTM del PRD', () => {
  it('slugify quita tildes y símbolos', () => {
    expect(slugify('Finfest (DropiPay y Confío)')).toBe('finfest-dropipay-y-confio')
  })
  it('slugBase quita el año y el sufijo de choque', () => {
    expect(slugBase('despega-2026')).toBe('despega')
    expect(slugBase('despega-2026-2')).toBe('despega')
  })
  it('código = 4 letras del evento + año + vertical (DESP26-ROAX)', () => {
    expect(codigoEvento('despega-2026', '2026-11-13', 'ROAX')).toBe('DESP26-ROAX')
    expect(codigoEvento('moda-2026', '2026-05-01', 'PROV')).toBe('MODA26-PROV')
    expect(codigoEvento('labs-summit-2026', '2026-10-28', 'chat')).toBe('LABS26-CHAT')
  })
  it('arma los 5 parámetros UTM de la convención', () => {
    const c = construirCanal({
      slug: 'despega-2026', fechaInicio: '2026-11-13', verticalSlug: 'roax', verticalCodigo: 'ROAX',
      paisISO: 'co', urlDestino: 'https://roax.dropi.co/registro',
    })
    expect(c.utm).toEqual({
      utm_source: 'despega', utm_medium: 'evento', utm_campaign: '2026-despega', utm_content: 'roax', utm_term: 'CO',
    })
    expect(c.codigo).toBe('DESP26-ROAX')
    const u = new URL(c.urlFinal)
    expect(u.searchParams.get('utm_medium')).toBe('evento')
    expect(u.searchParams.get('utm_term')).toBe('CO')
  })
  it('conserva parámetros que ya traía el destino', () => {
    const c = construirCanal({
      slug: 'despega-2026', fechaInicio: '2026-11-13', verticalSlug: 'roax', verticalCodigo: 'ROAX',
      paisISO: 'MX', urlDestino: 'https://x.co/f?form=eventos',
    })
    expect(new URL(c.urlFinal).searchParams.get('form')).toBe('eventos')
  })
})
