const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function partes(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return { y, m: m - 1, d }
}

/** "13–15 nov", "30 nov – 2 dic", "24 oct" */
export function rangoFechas(ini: string, fin: string): string {
  const a = partes(ini), b = partes(fin)
  if (ini === fin) return `${a.d} ${MES[a.m]}`
  if (a.m === b.m && a.y === b.y) return `${a.d}–${b.d} ${MES[a.m]}`
  return `${a.d} ${MES[a.m]} – ${b.d} ${MES[b.m]}`
}

export function fechaCorta(iso: string) {
  const a = partes(iso)
  return `${a.d} ${MES[a.m]} ${a.y}`
}

export function diasHasta(iso: string, hoy = new Date()): number {
  const a = partes(iso)
  const d0 = Date.UTC(a.y, a.m, a.d)
  const d1 = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((d0 - d1) / 86400000)
}

export function trimestreDe(iso: string): string {
  const { y, m } = partes(iso)
  return `${y}-Q${Math.floor(m / 3) + 1}`
}

export function trimestreActual(hoy = new Date()) {
  return `${hoy.getFullYear()}-Q${Math.floor(hoy.getMonth() / 3) + 1}`
}

export function limitesTrimestre(q: string): { ini: string; fin: string } {
  const [y, n] = q.split('-Q').map(Number)
  const m0 = (n - 1) * 3
  const fin = new Date(Date.UTC(y, m0 + 3, 0))
  return { ini: `${y}-${String(m0 + 1).padStart(2, '0')}-01`, fin: fin.toISOString().slice(0, 10) }
}

/** Hora del evento en la zona de su país y, al lado, la de Bogotá */
export function horaConZona(fechaIso: string, hora: string | null, zona: string | null): string | null {
  if (!hora) return null
  const z = zona ?? 'America/Bogota'
  const local = hora.slice(0, 5)
  if (z === 'America/Bogota') return `${local} (Bogotá)`
  const [h, mi] = hora.split(':').map(Number)
  const { y, m, d } = partes(fechaIso)
  // Offset de la zona del país en esa fecha: instante UTC = hora local − offset
  const ref = new Date(Date.UTC(y, m, d, h, mi))
  const offsetMin = (tz: string) => {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    const p = Object.fromEntries(f.formatToParts(ref).map((x) => [x.type, x.value]))
    return (Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour! % 24, +p.minute!) - ref.getTime()) / 60000
  }
  const instante = new Date(ref.getTime() - offsetMin(z) * 60000)
  const bog = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Bogota' }).format(instante)
  return `${local} (hora local) · ${bog} Bogotá`
}
