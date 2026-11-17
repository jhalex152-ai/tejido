// Convención de atribución del PRD §6 (igual en los 22 países)

export function slugify(t: string): string {
  return t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** El slug del hito termina en -AAAA (y -n si hubo choque): lo quitamos para el utm_source */
export function slugBase(slug: string): string {
  return slug.replace(/-(19|20)\d{2}(-\d+)?$/, '')
}

/** 4 letras del evento + año (2 dígitos) + vertical: DESP26-ROAX */
export function codigoEvento(slug: string, fechaInicio: string, codigoVertical: string, sufijo = ''): string {
  const letras = slugBase(slug).replace(/[^a-z]/g, '').toUpperCase().padEnd(4, 'X').slice(0, 4)
  const yy = fechaInicio.slice(2, 4)
  return `${letras}${yy}${sufijo}-${codigoVertical.toUpperCase()}`
}

export interface EntradaCanal {
  slug: string
  fechaInicio: string
  verticalSlug: string
  verticalCodigo: string
  paisISO: string
  urlDestino: string
  sufijo?: string
}

export function construirCanal(e: EntradaCanal) {
  const base = slugBase(e.slug)
  const utm = {
    utm_source: base,
    utm_medium: 'evento',
    utm_campaign: `${e.fechaInicio.slice(0, 4)}-${base}`,
    utm_content: e.verticalSlug,
    utm_term: e.paisISO.toUpperCase(),
  }
  const url = new URL(e.urlDestino)
  Object.entries(utm).forEach(([k, v]) => url.searchParams.set(k, v))
  return { codigo: codigoEvento(e.slug, e.fechaInicio, e.verticalCodigo, e.sufijo), utm, urlFinal: url.toString() }
}
