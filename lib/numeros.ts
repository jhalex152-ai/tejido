/** Número escrito por una persona: "9.000.000" y "1.500" son miles; "4,5" y "4.5" son decimales */
export function parseNumero(s: string): number | null {
  const t = s.trim()
  if (t === '') return null
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}
