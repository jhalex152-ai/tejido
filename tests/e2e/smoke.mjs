// Recorre las pantallas por rol y reporta errores de servidor, de consola y textos de error visibles.
import fs from 'node:fs'
import { abrir, entrar, BASE } from './lib.mjs'

const OUT = process.env.OUT ?? '/tmp/e2e-shots'
fs.mkdirSync(OUT, { recursive: true })
const RUTAS = {
  admin: ['/inicio', '/calendario', '/hitos', '/hitos/nuevo', '/paises', '/datos', '/tablero', '/admin', '/admin?s=paises', '/admin?s=verticales', '/admin?s=voceros', '/admin?s=monedas', '/admin?s=umbrales', '/admin?s=plantillas', '/admin?s=auditoria', '/notificaciones'],
  eventos: ['/inicio', '/calendario', '/hitos', '/paises', '/datos', '/tablero'],
  doer: ['/inicio', '/calendario', '/hitos', '/paises'],
  impacto: ['/inicio', '/hitos', '/tablero'],
  marcom: ['/inicio', '/hitos', '/datos', '/tablero'],
  datos: ['/inicio', '/datos', '/tablero'],
  consulta: ['/consulta'],
}
const roles = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(RUTAS)
const browser = await abrir()
let fallos = 0
for (const rol of roles) {
  const { page, ctx, errores } = await entrar(browser, rol)
  console.log(`\n== ${rol} → ${page.url().replace(BASE, '')}`)
  for (const ruta of RUTAS[rol]) {
    errores.length = 0
    const r = await page.goto(BASE + ruta, { waitUntil: 'networkidle' })
    const texto = (await page.locator('body').innerText()).slice(0, 4000)
    const malo = /Application error|This page could not be found|Unhandled Runtime Error|Internal Server Error|404/i.test(texto) ? ' TEXTO-DE-ERROR' : ''
    const estado = `${r.status()}${malo}${errores.length ? ' ERR:' + errores.slice(0, 2).join(' | ').slice(0, 200) : ''}`
    if (r.status() >= 400 || malo || errores.length) fallos++
    console.log(`  ${ruta.padEnd(24)} ${estado} → ${page.url().replace(BASE, '')}`)
    await page.screenshot({ path: `${OUT}/${rol}${ruta.replace(/[^a-z0-9]+/gi, '_')}.png` })
  }
  // Detalle de hitos: todas las pestañas visibles para el rol
  if (['admin', 'eventos', 'marcom', 'datos'].includes(rol)) {
    await page.goto(BASE + '/hitos', { waitUntil: 'networkidle' })
    const ids = [...new Set(await page.$$eval('a[href^="/hitos/"]', (as) => as.map((a) => a.getAttribute('href')).filter((h) => /^\/hitos\/[0-9a-f-]{36}$/.test(h))))]
    for (const href of ids.slice(0, rol === 'admin' ? 6 : 2)) {
      await page.goto(BASE + href, { waitUntil: 'networkidle' })
      const tabs = await page.$$eval('nav[aria-label="Secciones del hito"] a', (as) => as.map((a) => a.getAttribute('href')))
      for (const t of tabs) {
        errores.length = 0
        const r = await page.goto(BASE + t, { waitUntil: 'networkidle' })
        const texto = (await page.locator('body').innerText()).slice(0, 4000)
        const malo = /Application error|Unhandled Runtime Error|Internal Server Error/i.test(texto) ? ' TEXTO-DE-ERROR' : ''
        if (r.status() >= 400 || malo || errores.length) { fallos++; console.log(`  ${t.slice(0, 8)}…${t.slice(-22)} ${r.status()}${malo} ${errores.slice(0, 2).join(' | ').slice(0, 200)}`) }
      }
      console.log(`  detalle ${href.slice(-8)}: ${tabs.length} pestañas revisadas`)
    }
    await page.screenshot({ path: `${OUT}/${rol}_detalle.png` })
  }
  await ctx.close()
}
await browser.close()
console.log(`\n${fallos} pantallas con problemas`)
process.exit(fallos ? 1 : 0)
