import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
export const { chromium } = require('playwright')
export const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
export const PW = process.env.TEST_PW

export async function abrir() {
  const browser = await chromium.launch()
  return browser
}

/** Inicia sesión con correo y contraseña por el formulario real */
export async function entrar(browser, rol, { width = 1440, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, locale: 'es-CO', deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  const errores = []
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()))
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message))
  page.on('response', (r) => { if (r.status() >= 500) errores.push(`HTTP ${r.status()} ${r.url()}`) })
  await page.goto(`${BASE}/login`)
  await page.fill('#pw-email', `e2e-${rol}@pruebas.tejido.test`)
  await page.fill('#pw-pass', PW)
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 }), page.click('text=Entrar >> nth=-1').catch(() => page.click('button:has-text("Entrar")'))])
  return { ctx, page, errores }
}
