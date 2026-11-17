// Los títulos de etapa del tablero quedan fijos al bajar y siguen el desplazamiento lateral. Solo lectura.
import fs from 'node:fs'
import { abrir, BASE } from './lib.mjs'
const OUT = process.env.OUT ?? '/tmp/e2e-shots'; fs.mkdirSync(OUT, { recursive: true })
const browser = await abrir(); let mal = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✓' : '✗'} ${msg}`); if (!ok) mal++ }
const ctx = await browser.newContext({ viewport: { width: 1365, height: 640 }, locale: 'es-CO', reducedMotion: 'reduce' }); const page = await ctx.newPage()
await page.goto(BASE + '/login'); await page.fill('#pw-email', process.env.EMAIL); await page.fill('#pw-pass', process.env.PASSWORD)
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }), page.click('button:has-text("Entrar")')])
await page.goto(BASE + '/hitos', { waitUntil: 'networkidle' })
const info = () => page.evaluate(() => {
  const fila = document.querySelector('div.sticky.top-\\[61px\\]'), t = fila.querySelector('[aria-hidden]'), tab = document.querySelector('section[aria-label="Radar"]').parentElement
  const r = fila.getBoundingClientRect()
  const visibles = [...t.children].filter((c) => { const b = c.getBoundingClientRect(); return b.left >= 250 && b.right <= window.innerWidth + 1 }).map((c) => c.textContent.replace(/\s+/g, ' ').trim())
  const centro = document.elementFromPoint(r.left + 600, r.top + r.height / 2)
  return { top: Math.round(r.top), scrollY: Math.round(window.scrollY), tituloX: t.scrollLeft, tableroX: tab.scrollLeft, visibles, encima: !!centro && fila.contains(centro), docW: document.documentElement.scrollWidth }
})
let a = await info(); console.log(`  arriba: fila en y=${a.top}`)
await page.evaluate(() => window.scrollTo(0, 400)); await page.waitForTimeout(200)
let b = await info(); check(b.scrollY > 100 && b.top >= 55 && b.top <= 70, `al bajar ${b.scrollY}px la fila de títulos queda fija bajo la barra (y=${b.top})`)
check(b.encima, 'la fila de títulos está por encima de las tarjetas (no la tapan al pasar por debajo)')
await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(250)
let c = await info(); check(c.tableroX > 300 && c.tituloX === c.tableroX, `con → los títulos acompañan al tablero (tablero ${c.tableroX}px, títulos ${c.tituloX}px)`)
check(c.top >= 55 && c.top <= 70, 'seguir bajando o moviéndose de lado no suelta la fila')
check(c.visibles.join('|') !== b.visibles.join('|'), `los títulos visibles cambian: ${c.visibles.join(' · ')}`)
await page.screenshot({ path: `${OUT}/titulos_fijos.png` })
await page.getByRole('button', { name: 'Columnas siguientes' }).click(); await page.waitForTimeout(250)
let d = await info(); check(d.tableroX > c.tableroX && d.tituloX === d.tableroX, `el botón › avanza columnas (${c.tableroX} → ${d.tableroX}px)`)
await page.getByRole('button', { name: 'Columnas anteriores' }).click(); await page.getByRole('button', { name: 'Columnas anteriores' }).click(); await page.waitForTimeout(250)
let e = await info(); check(e.tableroX < d.tableroX && e.tituloX === e.tableroX, `el botón ‹ retrocede (${d.tableroX} → ${e.tableroX}px)`)
check(e.docW <= 1365, `la página no se desborda (${e.docW}px)`)
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(200)
const f = await info(); check(f.top > 200, `arriba del todo la fila vuelve a su lugar (y=${f.top})`)
await page.setViewportSize({ width: 390, height: 780 }); await page.goto(BASE + '/hitos', { waitUntil: 'networkidle' })
check(!(await page.locator('div.sticky.top-\\[61px\\]').isVisible()), 'en móvil no aparece la fila (hay una sola columna con selector)')
await ctx.close(); await browser.close()
console.log(mal ? `\n${mal} problemas` : '\nTodo bien'); process.exit(mal ? 1 : 0)
