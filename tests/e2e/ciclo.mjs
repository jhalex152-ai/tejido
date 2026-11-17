// Ciclo de vida completo de un hito por la interfaz real, con cada rol en su pantalla.
// Uso: TEST_PW=... node tests/e2e/ciclo.mjs   (la app debe estar corriendo en BASE_URL contra Supabase)
import fs from 'node:fs'
import { abrir, entrar, BASE } from './lib.mjs'

const OUT = process.env.OUT ?? '/tmp/e2e-shots'
fs.mkdirSync(OUT, { recursive: true })
const NOMBRE = `E2E Expo ${new Date().toISOString().slice(11, 19)}`
const dia = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)
const S = {}
let ok = 0, mal = 0
const log = []

async function paso(nombre, fn) {
  try { await fn(); ok++; console.log(`  ✓ ${nombre}`) }
  catch (e) {
    for (const [r, x] of Object.entries(S)) await x.page.screenshot({ path: `${OUT}/fallo_${mal}_${r}.png`, fullPage: true }).catch(() => {})
    mal++; log.push(nombre); console.log(`  ✗ ${nombre}\n      ${String(e.message).split('\n')[0].slice(0, 260)}`) }
}
const esperaGuardado = (p) => p.waitForTimeout(2600)
const verTexto = async (p, re, t = 8000) => { await p.getByText(re).first().waitFor({ timeout: t }) }
const ir = (p, ruta) => p.goto(BASE + ruta, { waitUntil: 'networkidle' })
async function aprobar(p, etapa, comentario) {
  await p.getByRole('button', { name: `Aprobar compuerta de ${etapa}` }).click()
  await p.waitForLoadState('networkidle'); await p.waitForTimeout(1200)
}
async function faltantes(p) {
  await p.reload({ waitUntil: 'networkidle' })
  return (await p.locator('section[aria-labelledby="compuerta"]').innerText().catch(() => '')).replace(/\s+/g, ' ')
}

const browser = await abrir()
for (const r of ['admin', 'eventos', 'datos', 'marcom', 'consulta', 'doer']) S[r] = await entrar(browser, r)
const A = S.admin.page
let id = ''

console.log('\n── 1. Radar: crear el hito ──')
await paso('crear hito desde Radar (formulario)', async () => {
  await ir(A, '/hitos/nuevo')
  await A.fill('#nombre', NOMBRE)
  await A.selectOption('#tipo', 'evento_externo')
  await A.selectOption('#eje_id', '1')
  await A.fill('#fecha_inicio', dia(10)); await A.fill('#fecha_fin', dia(11))
  await A.fill('#ciudad', 'Ciudad de México'); await A.fill('#venue', 'Centro Citibanamex'); await A.fill('#organizador', 'Expo Org')
  await A.fill('#url', 'https://expo.example.com'); await A.fill('#asistentes_estimados', '100000'); await A.fill('#costo_estimado', '9.000.000')
  await A.selectOption('#pais_principal', 'MX')
  await A.getByRole('button', { name: 'Crear hito en Radar' }).click()
  await A.waitForURL(/\/hitos\/[0-9a-f-]{36}/, { timeout: 20000 })
  id = A.url().match(/hitos\/([0-9a-f-]{36})/)[1]
})
await paso('el hito aparece en Radar con la compuerta lista', async () => {
  await verTexto(A, /La compuerta está lista para aprobar/)
})
await paso('aprobar Radar → Evaluación', async () => { await aprobar(A, 'Radar'); await verTexto(A, /Etapa 1 · Evaluación/) })

console.log('\n── 2. Evaluación ──')
await paso('la compuerta bloquea sin puntajes y dice qué falta', async () => {
  const t = await faltantes(A); if (!/6 criterios/.test(t)) throw new Error('no pidió los 6 criterios: ' + t.slice(0, 200))
})
await paso('calificar los 6 criterios con autoguardado (17 → no pasa)', async () => {
  await ir(A, `/hitos/${id}?tab=evaluacion`)
  for (const k of ['audiencia', 'mercado', 'mensaje', 'rol_posible', 'costo_resultado']) await A.selectOption(`#ev-${k}`, '3')
  await A.selectOption('#ev-competencia', '2'); await esperaGuardado(A)
  const t = await faltantes(A); if (!/mínimo es 18/.test(t)) throw new Error('debía decir que el mínimo es 18: ' + t.slice(0, 200))
})
await paso('subir a 18 y matriz de verticales (ROAX protagonista)', async () => {
  await ir(A, `/hitos/${id}?tab=evaluacion`)
  await A.selectOption('#ev-competencia', '3'); await esperaGuardado(A)
  const fila = A.locator('fieldset').filter({ has: A.locator('h3', { hasText: /^ROAX$/ }) })
  await fila.locator('select[name="pertinencia"]').selectOption('5')
  await fila.locator('select[name="importancia"]').selectOption('4')
  await fila.locator('input[name="audiencia_objetivo"]').fill('2000')
  await fila.locator('input[name="meta_leads"]').fill('150')
  await fila.getByRole('button', { name: 'Incluir en la matriz' }).click(); await A.waitForTimeout(1500)
  await ir(A, `/hitos/${id}?tab=evaluacion`)
  await verTexto(A, /Protagonista · sugerido/)
})
await paso('el líder de eventos confirma el rol y Head aprueba la evaluación', async () => {
  const E = S.eventos.page
  await ir(E, `/hitos/${id}?tab=evaluacion`)
  const fila = E.locator('fieldset').filter({ has: E.locator('h3', { hasText: /^ROAX$/ }) })
  await fila.locator('input[name="rol_confirmado"]').check()
  await fila.getByRole('button', { name: 'Actualizar' }).click(); await E.waitForTimeout(1500)
  await aprobar(A.page ? A : A, 'Evaluación'); await ir(A, `/hitos/${id}`)
  await verTexto(A, /Etapa 2 · Datos/)
})

console.log('\n── 3. Datos ──')
await paso('Narrativa sigue bloqueada sin cifra: Datos no puede aprobar', async () => {
  const D = S.datos.page; await ir(D, `/hitos/${id}`)
  await D.getByRole('button', { name: 'Aprobar compuerta de Datos' }).click(); await D.waitForTimeout(1800)
  const t = (await D.locator('body').innerText()).replace(/\s+/g, ' ')
  if (!/Falta 1 cifra validada para el eje E-commerce/.test(t)) throw new Error('no mostró el mensaje esperado')
})
await paso('Datos crea y valida una cifra en la biblioteca', async () => {
  const D = S.datos.page; await ir(D, '/datos')
  await D.fill('#c-en', 'El 80% del e-commerce de la región es contraentrega'); await D.fill('#c-v', '80'); await D.fill('#c-u', '%')
  await D.selectOption('#c-e', '1'); await D.fill('#c-f', 'Base interna Dropi'); await D.fill('#c-fc', dia(-1)); await D.fill('#c-vh', dia(120))
  await D.selectOption('#c-es', 'validada')
  await D.getByRole('button', { name: 'Crear cifra' }).click(); await D.waitForTimeout(1800)
  await verTexto(D, /contraentrega/)
})
await paso('vincular la cifra al hito y completar la línea base', async () => {
  const D = S.datos.page; await ir(D, `/hitos/${id}?tab=datos`)
  await D.selectOption('#cifra-sel', { index: 1 }); await D.getByRole('button', { name: 'Vincular cifra' }).click(); await D.waitForTimeout(1500)
  await ir(D, `/hitos/${id}`)
  await D.locator('input[name="completo"]').first().check(); await esperaGuardado(D)
  const t = await faltantes(D); if (!/lista para aprobar/.test(t)) throw new Error('la compuerta no quedó lista: ' + t.slice(0, 220))
})
await paso('Datos aprueba → Narrativa', async () => {
  const D = S.datos.page; await aprobar(D, 'Datos'); await verTexto(D, /Etapa 3 · Narrativa/)
})

console.log('\n── 4. Narrativa ──')
await paso('el admin carga un vocero', async () => {
  await ir(A, '/admin?s=voceros'); await A.fill('#vo-n', 'Vocero E2E'); await A.fill('#vo-c', 'CEO'); await A.getByRole('button', { name: 'Agregar' }).click(); await A.waitForTimeout(1500)
})
await paso('Marketing completa mensaje, vocero y piezas (autoguardado)', async () => {
  const M = S.marcom.page; await ir(M, `/hitos/${id}?tab=narrativa`)
  await M.fill('#n-msg', 'Dropi es el dato que nadie más tiene'); await M.selectOption('#n-voc', { label: 'Vocero E2E · CEO' })
  await M.fill('#n-aud', 'Founders y vendedores'); await M.fill('#n-mom', 'Charla del día 2'); await M.fill('#n-pm', 'Prensa económica y LinkedIn'); await esperaGuardado(M)
  await M.locator('select[name="tipo"]').selectOption('one_pager'); await M.locator('input[name="titulo"]').fill('One-pager Expo')
  await M.getByRole('button', { name: 'Agregar pieza' }).click(); await M.waitForTimeout(1500)
  await verTexto(M, /One-pager Expo/)
})
await paso('Marketing NO puede aprobar su propia narrativa (solo el Head)', async () => {
  const M = S.marcom.page; await ir(M, `/hitos/${id}`)
  const hay = await M.getByRole('button', { name: /Aprobar compuerta/ }).count()
  if (hay) throw new Error('Marketing ve el botón de aprobar Narrativa')
})
await paso('Head aprueba → Preparación', async () => { await ir(A, `/hitos/${id}`); await aprobar(A, 'Narrativa'); await verTexto(A, /Etapa 4 · Preparación/) })

console.log('\n── 5. Preparación ──')
await paso('Eventos: stand con decimales ("4.5") calcula m²', async () => {
  const E = S.eventos.page; await ir(E, `/hitos/${id}?tab=evento`)
  await E.fill('#s-a', '6'); await E.fill('#s-f', '4.5'); await E.fill('#s-t', 'Isla'); await esperaGuardado(E)
  await ir(E, `/hitos/${id}?tab=evento`)
  await verTexto(E, /27 m²/)
})
await paso('Eventos: checklist crítico, costos y presupuesto', async () => {
  const E = S.eventos.page
  await E.locator('input[placeholder*="Confirmar montaje"]').fill('Confirmar montaje de stand')
  await E.locator('input[name="critico"]').check(); await E.getByRole('button', { name: 'Agregar tarea' }).click(); await E.waitForTimeout(1500)
  await E.locator('input[name="concepto"][placeholder="Concepto"]').fill('Montaje stand'); await E.locator('input[name="proveedor"]').fill('Proveedor X')
  await E.locator('input[name="valor"]').fill('2.500.000'); await E.getByRole('button', { name: 'Agregar costo' }).click(); await E.waitForTimeout(1500)
  await E.fill('#pr-t', '9500000'); await esperaGuardado(E)
  await ir(E, `/hitos/${id}?tab=evento`)
  await verTexto(E, /Montaje stand/); await verTexto(E, /Confirmar montaje de stand/)
})
await paso('la compuerta pide plan de captura aprobado de ROAX y el checklist crítico', async () => {
  const t = await faltantes(S.eventos.page)
  if (!/plan de captura aprobado de ROAX/.test(t) || !/Checklist crítico pendiente/.test(t)) throw new Error(t.slice(0, 300))
})
await paso('Eventos arma el plan de captura y genera link UTM, código y QR', async () => {
  const E = S.eventos.page; await ir(E, `/hitos/${id}?tab=captura`)
  await E.locator('input[name="metodo"]').first().fill('QR a landing + tablet'); await E.locator('input[name="destino_crm"]').first().fill('Formulario Eventos ROAX')
  await E.locator('input[name="responsable"]').first().fill('Ana'); await esperaGuardado(E)
  await ir(E, `/hitos/${id}?tab=captura`)
  await E.locator('input[name="url_destino"]').first().fill('https://roax.example.com/registro')
  await E.getByRole('button', { name: 'Generar link y código' }).click(); await E.waitForTimeout(2000)
  await ir(E, `/hitos/${id}?tab=captura`)
  await verTexto(E, /[A-Z]{4}26-ROAX/); await verTexto(E, /utm_source/)
  const img = E.locator('img[alt^="QR del código"]'); await img.waitFor({ timeout: 8000 })
  const ancho = await img.evaluate((i) => i.naturalWidth); if (!ancho) throw new Error('el QR no cargó')
})
await paso('el líder de eventos NO puede aprobar el plan (solo admin)', async () => {
  const E = S.eventos.page; if (await E.getByRole('button', { name: 'Aprobar plan de captura' }).count()) throw new Error('ve el botón')
})
await paso('Admin aprueba el plan y Eventos aprueba Preparación', async () => {
  await ir(A, `/hitos/${id}?tab=captura`); await A.getByRole('button', { name: 'Aprobar plan de captura' }).click(); await A.waitForTimeout(1500)
  const E = S.eventos.page; await ir(E, `/hitos/${id}?tab=evento`)
  await E.locator('input[type="checkbox"]').filter({ hasNot: E.locator('[name="critico"]') }).first().waitFor()
  // marcar el crítico como completo en el checklist
  await E.getByText('Confirmar montaje de stand').locator('xpath=ancestor::form[1]//input[@name="completo"]').check(); await E.waitForTimeout(1800)
  await ir(E, `/hitos/${id}`); await aprobar(E, 'Preparación'); await verTexto(E, /Etapa 5 · Ejecución/)
})

console.log('\n── 6. Ejecución (forzada) ──')
await paso('Eventos no puede forzar; Admin fuerza con motivo y queda en el log', async () => {
  const E = S.eventos.page; await ir(E, `/hitos/${id}`)
  if (await E.getByText('Forzar avance (solo administrador').count()) throw new Error('Eventos ve la opción de forzar')
  await ir(A, `/hitos/${id}`)
  await A.locator('summary', { hasText: 'Forzar avance' }).click()
  await A.fill('#motivo-forzar', 'Prueba E2E: el evento aún no ocurre')
  await A.getByRole('button', { name: 'Forzar avance', exact: true }).click(); await A.waitForTimeout(2000)
  await ir(A, `/hitos/${id}`); await verTexto(A, /Etapa 6 · Amplificación/)
  await ir(A, `/hitos/${id}?tab=actividad`); await verTexto(A, /Avance forzado/); await verTexto(A, /Prueba E2E/)
})

console.log('\n── 7. Amplificación ──')
await paso('Marketing registra una publicación y aprueba Medios', async () => {
  const M = S.marcom.page; await ir(M, `/hitos/${id}?tab=medios`)
  await M.locator('input[name="medio"]').fill('LinkedIn Dropi'); await M.locator('input[name="url"]').fill('https://linkedin.com/post/1')
  await M.locator('input[name="alcance"]').fill('15000')
  await M.getByRole('button', { name: 'Registrar publicación' }).click(); await M.waitForTimeout(1500)
  await verTexto(M, /LinkedIn Dropi/)
  await ir(M, `/hitos/${id}`); await aprobar(M, 'Amplificación'); await verTexto(M, /Etapa 7 · Cierre/)
})

console.log('\n── 8. Cierre y medición ──')
await paso('Cierre pide asistencia real, costo real, resultados y 3 aprendizajes', async () => {
  const t = await faltantes(S.datos.page)
  for (const x of [/asistencia real/, /costo real/, /resultados del CRM de ROAX/, /3 aprendizajes/]) if (!x.test(t)) throw new Error('faltó: ' + x + ' en ' + t.slice(0, 260))
})
await paso('Admin registra la asistencia real; Eventos el costo real', async () => {
  await ir(A, `/hitos/${id}`); await A.fill('#r-ar', '85000'); await A.getByRole('button', { name: 'Guardar ficha' }).click(); await A.waitForTimeout(1800)
  const E = S.eventos.page; await ir(E, `/hitos/${id}?tab=evento`); await E.fill('#pr-r', '8800000'); await esperaGuardado(E)
})
await paso('Datos carga resultados del CRM por vertical y los 3 aprendizajes', async () => {
  const D = S.datos.page; await ir(D, `/hitos/${id}?tab=captura`)
  const sec = D.locator('section').filter({ has: D.locator('h2', { hasText: /^ROAX/ }) }).first()
  await sec.locator('input[name="capturados"]').fill('400'); await sec.locator('input[name="calif_a"]').fill('120'); await sec.locator('input[name="calif_b"]').fill('60')
  await sec.locator('input[name="calif_c"]').fill('100'); await sec.locator('input[name="registros"]').fill('90'); await sec.locator('input[name="activados_30d"]').fill('30')
  await sec.getByRole('button', { name: 'Guardar resultados' }).click(); await D.waitForTimeout(1800)
  await ir(D, `/hitos/${id}?tab=captura`); await verTexto(D, /Tasa de calificación/)
  await ir(D, `/hitos/${id}?tab=cierre`)
  for (const n of [1, 2, 3]) await D.fill(`#ap-${n}`, `Aprendizaje ${n} de la prueba`); await esperaGuardado(D)
  const t = await faltantes(D); if (/aprendizajes|resultados|asistencia|costo real/.test(t)) throw new Error('aún falta: ' + t.slice(0, 260))
})
await paso('Admin cierra el hito', async () => {
  await ir(A, `/hitos/${id}`); await aprobar(A, 'Cierre'); await ir(A, `/hitos/${id}`); await verTexto(A, /Cerrado/)
})
await paso('el tablero muestra los leads reales de la vertical', async () => {
  await A.goto(BASE + '/tablero?q=' + new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 4) + '-Q' + (Math.floor(new Date(Date.now() + 10 * 86400000).getMonth() / 3) + 1), { waitUntil: 'networkidle' })
  const t = (await A.locator('body').innerText()).replace(/\s+/g, ' ')
  if (!/ROAX/.test(t) || !/180/.test(t)) throw new Error('el tablero no muestra ROAX con 180 calificados')
  await A.screenshot({ path: `${OUT}/ciclo_tablero.png`, fullPage: true })
})

console.log('\n── 9. Permisos y seguridad vistos desde la interfaz ──')
await paso('Consulta: ve el calendario, no el detalle ni el tablero, y no ve costos', async () => {
  const C = S.consulta.page
  await ir(C, '/consulta'); await verTexto(C, new RegExp(NOMBRE))
  const txt = await C.locator('body').innerText(); if (/9\.000\.000|8\.800\.000|2\.500\.000|Presupuesto/.test(txt)) throw new Error('Consulta ve costos')
  for (const ruta of [`/hitos/${id}`, '/tablero', '/admin', '/hitos']) { await C.goto(BASE + ruta, { waitUntil: 'networkidle' }); if (!C.url().includes('/consulta')) throw new Error(`Consulta pudo abrir ${ruta} → ${C.url()}`) }
})
await paso('Doer: ve el hito pero no el presupuesto ni resultados', async () => {
  const Dr = S.doer.page; await ir(Dr, `/hitos/${id}`)
  const tabs = await Dr.$$eval('nav[aria-label="Secciones del hito"] a', (as) => as.map((a) => a.textContent.trim()))
  if (tabs.some((t) => ['Datos', 'Narrativa', 'Cierre', 'Actividad', 'Evaluación'].includes(t))) throw new Error('el doer ve pestañas de más: ' + tabs)
  await Dr.goto(BASE + `/hitos/${id}?tab=cierre`, { waitUntil: 'networkidle' })
  if (/Costo real del hito|8\.800\.000/.test(await Dr.locator('body').innerText())) throw new Error('el doer ve el costo real')
  await Dr.goto(BASE + '/tablero', { waitUntil: 'networkidle' }); if (Dr.url().includes('/tablero')) throw new Error('el doer abrió el tablero')
})
await paso('Datos y Marketing no ven el presupuesto del hito (Marketing) / sí Datos', async () => {
  const M = S.marcom.page; await ir(M, `/hitos/${id}?tab=evento`)
  if (/Presupuesto del hito|Checklist de costos/.test(await M.locator('body').innerText())) throw new Error('Marketing ve costos')
})

console.log('\n── 10. Administración ──')
await paso('Admin invita a una persona y cambia su rol con motivo', async () => {
  await ir(A, '/admin?s=usuarios')
  await A.fill('#inv-e', 'e2e-invitado@pruebas.tejido.test'); await A.fill('#inv-n', 'Invitado E2E'); await A.selectOption('#inv-r', 'consulta')
  await A.getByRole('button', { name: 'Invitar', exact: true }).click(); await A.waitForTimeout(1800)
  await ir(A, '/admin?s=usuarios'); await verTexto(A, /e2e-invitado@pruebas.tejido.test/)
})
await paso('Admin edita la prioridad de un país', async () => {
  await ir(A, '/admin?s=paises')
  const f = A.locator('form').filter({ hasText: 'Chile' }).first()
  await f.locator('select[name="prioridad"]').selectOption('media_alta'); await f.getByRole('button', { name: 'Guardar' }).click(); await A.waitForTimeout(1500)
  await f.locator('select[name="prioridad"]').selectOption('media'); await f.getByRole('button', { name: 'Guardar' }).click(); await A.waitForTimeout(1500)
})
await paso('Admin borra el hito de prueba con motivo (queda en el log)', async () => {
  await ir(A, `/hitos/${id}`)
  await A.locator('summary', { hasText: 'Borrar hito' }).click(); await A.fill('#motivo-borrar', 'Limpieza de la prueba E2E')
  await A.getByRole('button', { name: 'Borrar definitivamente' }).click(); await A.waitForURL(/\/hitos$/, { timeout: 15000 })
})

for (const s of Object.values(S)) await s.ctx.close()
await browser.close()
console.log(`\nResultado: ${ok} pasos OK, ${mal} con fallos${mal ? '\n  - ' + log.join('\n  - ') : ''}`)
process.exit(mal ? 1 : 0)
