import { describe, expect, it } from 'vitest'
import { parseNumero } from '@/lib/numeros'

describe('números escritos por personas', () => {
  it.each([['4.5', 4.5], ['4,5', 4.5], ['9.000.000', 9000000], ['1.500', 1500], ['2000', 2000], ['1.234,56', 1234.56], ['abc', null], ['', null]])('%s → %s', (i, o) => expect(parseNumero(i)).toBe(o))
})
