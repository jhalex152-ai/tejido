import fs from 'node:fs'
import { abrir, entrar, BASE } from './lib.mjs'
const OUT = process.env.OUT ?? '/tmp/e2e-shots'; fs.mkdirSync(OUT, { recursive: true })
const browser = await abrir(); let mal = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✓' : '✗'} ${msg}`); if (!ok) mal++ }

console.log('── Móvil 360 px (sin scroll horizontal) ──')
for (const rol of ['admin', 'eventos', 'consulta']) {
  const { page, ctx } = await entrar(browser, rol, { width: 360, height: 780 })
  const rutas = rol === 'consulta' ? ['/consulta'] : ['/inicio', '/calendario', '/hitos', '/paises', '/hitos/nuevo', ...(rol === 'admin' ? ['/tablero', '/admin', '/datos'] : [])]
  for (const r of rutas) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' })
    const ancho = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }))
    check(ancho.s <= ancho.w + 1, `${rol} ${r}: scrollWidth ${ancho.s} / viewport ${ancho.w}`)
    if (['/inicio', '/hitos', '/consulta'].includes(r)) await page.screenshot({ path: `${OUT}/movil_${rol}_${r.replace(/\W/g, '')}.png` })
  }
  if (rol === 'admin') {
    await page.goto(BASE + '/hitos', { waitUntil: 'networkidle' })
    const href = await page.$$eval('a[href^="/hitos/"]', (as) => as.map((a) => a.getAttribute('href')).find((h) => /^\/hitos\/[0-9a-f-]{36}$/.test(h)))
    await page.goto(BASE + href, { waitUntil: 'networkidle' })
    const a = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }))
    check(a.s <= a.w + 1, `admin detalle de hito: scrollWidth ${a.s} / viewport ${a.w}`)
    await page.screenshot({ path: `${OUT}/movil_detalle.png`, fullPage: false })
    // objetivos táctiles ≥ 44 px en botones y enlaces visibles
    const chicos = await page.$$eval('button, a[href], select, input:not([type=hidden])', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40) && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]') && e.type !== 'checkbox' }).slice(0, 6).map((e) => `${e.tagName} "${(e.textContent || e.name || '').trim().slice(0, 24)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`))
    check(chicos.length === 0, `objetivos táctiles ≥ 40 px${chicos.length ? ' → ' + chicos.join(' · ') : ''}`)
  }
  await ctx.close()
}

console.log('── Kanban: arrastrar tarjetas (escritorio) ──')
const { page, ctx } = await entrar(browser, 'admin')
await page.goto(BASE + '/hitos', { waitUntil: 'networkidle' })
const tarjeta = page.locator('a[href^="/hitos/"]', { hasText: 'Plaza de Wein' }).first()
const col = (n) => page.locator(`section[aria-label="${n}"]`)
async function arrastrar(card, destino) {
  const a = await card.boundingBox(), b = await destino.boundingBox()
  await page.mouse.move(a.x + a.width / 2, a.y + 20); await page.mouse.down()
  await page.mouse.move(a.x + a.width / 2 + 20, a.y + 40, { steps: 5 })
  await page.mouse.move(b.x + b.width / 2, b.y + 80, { steps: 15 }); await page.mouse.up(); await page.waitForTimeout(2200)
}
await arrastrar(tarjeta, col('Preparación'))
let txt = await page.locator('body').innerText()
check(/solo puedes mover un hito a su siguiente etapa/.test(txt) && page.url().endsWith('/hitos'), 'saltar etapas se rechaza con mensaje claro y sin abrir el hito')
await arrastrar(page.locator('a[href^="/hitos/"]', { hasText: 'Plaza de Wein' }).first(), col('Datos'))
txt = (await page.locator('body').innerText()).replace(/\s+/g, ' ')
check(/Plaza de Wein: No se puede aprobar la compuerta de Evaluación/.test(txt) && page.url().endsWith('/hitos'), 'mover a la siguiente con compuerta incompleta muestra lo que falta (sin abrir el hito)')
await arrastrar(page.locator('a[href^="/hitos/"]', { hasText: 'Plaza de Wein' }).first(), col('Evaluación'))
check(page.url().endsWith('/hitos'), 'soltar la tarjeta en su misma columna no abre el hito')
await page.locator('a[href^="/hitos/"]', { hasText: 'Plaza de Wein' }).first().click(); await page.waitForURL(/\/hitos\/[0-9a-f-]{36}/, { timeout: 10000 })
check(true, 'un clic normal sí abre el detalle del hito')
await page.goto(BASE + '/hitos', { waitUntil: 'networkidle' })
await page.screenshot({ path: `${OUT}/kanban_arrastre.png` })
await ctx.close(); await browser.close()
console.log(mal ? `\n${mal} problemas` : '\nTodo bien'); process.exit(mal ? 1 : 0)
