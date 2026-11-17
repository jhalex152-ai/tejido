// Ninguna pantalla debe desbordar la página a lo ancho (el scroll horizontal solo puede ocurrir dentro del tablero).
import fs from 'node:fs'
import { abrir, BASE } from './lib.mjs'
const OUT = process.env.OUT ?? '/tmp/e2e-shots'; fs.mkdirSync(OUT, { recursive: true })
const browser = await abrir(); let mal = 0
// Solo lectura: entra con EMAIL / PASSWORD (por defecto una cuenta administradora)
const ctx = await browser.newContext({ viewport: { width: 1365, height: 700 }, locale: 'es-CO' }); const page = await ctx.newPage()
await page.goto(BASE + '/login'); await page.fill('#pw-email', process.env.EMAIL); await page.fill('#pw-pass', process.env.PASSWORD)
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }), page.click('button:has-text("Entrar")')])
await page.goto(BASE + '/hitos', { waitUntil: 'networkidle' })
const id = (await page.$$eval('a[href^="/hitos/"]', (as) => as.map((a) => a.getAttribute('href')).find((h) => /^\/hitos\/[0-9a-f-]{36}$/.test(h))))
const rutas = ['/inicio', '/calendario', '/hitos', '/hitos/nuevo', '/paises', '/datos', '/tablero', '/admin', '/admin?s=paises', '/admin?s=usuarios', '/notificaciones', id, `${id}?tab=evaluacion`, `${id}?tab=evento`, `${id}?tab=captura`, `${id}?tab=cierre`, `${id}?tab=medios`]
for (const w of [1024, 1280, 1365, 1440, 1920]) {
  await page.setViewportSize({ width: w, height: 700 })
  for (const r of rutas) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' })
    const m = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, vp: window.innerWidth }))
    if (m.doc > m.vp + 1) { mal++; console.log(`  ✗ ${w}px ${r.replace(id, '[id]')}: la página mide ${m.doc}`) }
  }
}
// El tablero debe desplazarse por dentro, sin mover la página
await page.setViewportSize({ width: 1365, height: 700 }); await page.goto(BASE + '/hitos', { waitUntil: 'networkidle' })
const antes = await page.evaluate(() => { const s = document.querySelector('section[aria-label="Radar"]').parentElement; s.scrollLeft = 900; return { interno: s.scrollLeft, pagina: window.scrollX, doc: document.documentElement.scrollWidth } })
console.log(`  tablero: scroll interno ${antes.interno}px, scroll de la página ${antes.pagina}px, ancho del documento ${antes.doc}px`)
if (antes.interno < 100 || antes.pagina !== 0) { mal++; console.log('  ✗ el tablero no se desplaza solo por dentro') }
await page.screenshot({ path: `${OUT}/kanban_scroll_interno.png` })
await ctx.close(); await browser.close()
console.log(mal ? `\n${mal} problemas` : '\n✓ Sin desbordes de página a 1024, 1280, 1365, 1440 y 1920 px'); process.exit(mal ? 1 : 0)
