\# PRD — App PR, Eventos y Ecosistema Dropi  
  
Nov 16, 2026 · @Jhonnathan Rueda  
  
\#\# 1. Resumen y objetivo  
  
\*\*Tejido\*\* (nombre de trabajo) es la app interna del área de PR, Ecosistema y Eventos de Dropi: hace que cada hito pase por Datos → Narrativa → Eventos → Medios, en ese orden; también define cómo se capturan los leads de cada vertical en cada evento y mide cuántos leads reales dejó, en los 22 países donde opera Dropi. Se construye en Next.js, con Supabase como base de datos y autenticación, código en GitHub y despliegue en Vercel.  
  
La app responde cinco preguntas en cualquier momento:  
  
1\. ¿En qué etapa está cada hito y qué lo frena?  
2\. ¿Qué equipo debe entrar ahora y qué le toca entregar?  
3\. ¿Qué información hay que capturar en esta etapa?  
4\. ¿Qué verticales de Dropi deben estar en este evento, y con qué meta?  
5\. ¿Cuántos leads reales dejó el evento por vertical, y a qué costo?  
  
\*\*Métricas de éxito del producto (medidas al cierre de Q1 2027, sobre la línea base de Q4 2026):\*\*  
  
| Métrica | Meta | Cómo se mide |  
| --- | --- | --- |  
| Hitos que pasan por los 4 movilizadores | 100% de los hitos aprobados | Hitos cerrados con las 4 compuertas aprobadas / hitos cerrados |  
| Hitos con dato validado antes de narrativa | 100% | La app bloquea el avance sin dato; se audita en el log |  
| Amplificación en 48 h | ≥ 90% de los eventos | Primera publicación ≤ 48 h después de la fecha de fin |  
| Eventos con plan de captura por vertical | 100% de los eventos con vertical presente | Plan aprobado en Preparación y resultados del CRM cargados en el Cierre |  
| Adopción del equipo | 7 de 7 personas activas semanalmente | Sesiones por usuario en el log de actividad |  
| Tiempo para saber el estado de un hito | \< 30 segundos | Prueba de usabilidad con el Head y el transversal |  
  
\#\# 2. Problema y contexto  
  
Hoy la información del área vive en chats, hojas sueltas y la cabeza de cada persona, así que un hito puede llegar al evento sin cifra, sin vocero o sin plan de amplificación. Dos casos de Q4 2026 lo muestran:  
  
\- \*\*Revista Semana (24 oct):\*\* Dropi salió, pero sin dato ni plan de amplificación; el momento no se capitalizó.  
\- \*\*Labs Summit, Tuluá (28–30 oct):\*\* patrocinio oficial, speaker propia, todo brandeado y la competencia en la tarima de Dropi. Es el estándar que la app debe volver repetible.  
  
Tres dolores concretos que la app resuelve:  
  
1\. \*\*Etapa invisible.\*\* Nadie sabe, sin preguntar, si un hito ya tiene dato, mensaje, stand y plan de medios.  
2\. \*\*Relevos tardíos.\*\* Datos, comunicaciones, social y eventos entran cuando se acuerdan, no cuando el proceso lo pide.  
3\. \*\*Asistentes ≠ leads.\*\* Un evento de 100.000 asistentes se reporta por su aforo, aunque solo una fracción sea público de cada vertical. Sin captura atribuida, no se sabe qué dejó el evento a ROAX, Chatea Pro, Proveedores u otra vertical.  
  
El área trabaja sobre 4 ejes (e-commerce, tecnología, gremios y gobierno, social) y 4 movilizadores en orden fijo: sin dato no hay narrativa, sin narrativa un evento es solo un stand, y sin medios el evento muere ese mismo día.  
  
\#\# 3. Modelo conceptual  
  
La unidad de trabajo es el \*\*hito\*\*: todo lo que el área hace para que Dropi se cuente en el lugar correcto. Cada hito tiene un eje principal (y ejes secundarios opcionales), pasa por los 4 movilizadores en orden y declara qué verticales de Dropi participan.  
  
\*\*Tipos de hito:\*\* evento externo (stand, patrocinio, speaker), evento propio (Expowinners, Gira Dropi, Dropi Day), aparición en medios, ranking o premio, gremio o mesa de gobierno, acción social (entregas, visitas, alianzas con fundaciones) y campaña (Black Friday).  
  
\#\#\# Los 4 ejes: dónde Dropi quiere ser referente  
  
| Eje | Qué posiciona | Indicador de eje |  
| --- | --- | --- |  
| E-commerce | Dropshipping, proveedores, marcas, logística | Activaciones desde eventos |  
| Tecnología | IA (ROAX, Chatea Pro), fintech (DropiPay, ConfioPagos), narrativa unicornio | Presencia en rankings y relación con founders / VCs |  
| Gremios y gobierno | El dato que nadie más tiene (80%+ del e-commerce contraentrega) | Afiliaciones y mesas activas |  
| Social | Impacto: cada vendedor que genera ingresos | Alianzas RSE activas |  
  
\#\#\# Los 4 movilizadores: cómo se activa, en orden fijo  
  
| \# | Movilizador | Pregunta que responde | Dueño | Momento |  
| --- | --- | --- | --- | --- |  
| 1 | Datos | ¿Cuál es la cifra correcta para este momento? | Ricky (Datos) | Antes |  
| 2 | Narrativa | ¿Qué contamos, quién lo cuenta y cuándo? | Harold (Marketing y comunicaciones) | Antes |  
| 3 | Eventos | ¿Dónde estamos presentes y por qué? | Jaqui (Eventos), con Adriana; Sandra en hitos sociales | Durante |  
| 4 | Medios | ¿Por dónde lo amplificamos? | Harold (Marketing y comunicaciones) | 48 h después |  
  
Regla de oro: \*\*una etapa no se abre si la anterior no tiene su compuerta aprobada.\*\* El Head y el transversal pueden forzar el avance, pero queda registrado con motivo en el log.  
  
\#\#\# Verticales y pertinencia  
  
Cada hito declara qué verticales participan (Dropshippers, Proveedores, Marcas propias, Logística y Fulfillment, Dropi Academy, ROAX, Chatea Pro, DropiPay, ConfioPagos, Vibe, Dropi Pro; el catálogo es editable porque Dropi habla de +12). Por cada vertical se califica:  
  
\- \*\*Pertinencia de audiencia (1–5):\*\* ¿está ahí su público?  
\- \*\*Importancia estratégica (1–5):\*\* ¿qué tanto le sirve hoy a la vertical?  
\- \*\*Rol resultante:\*\* Protagonista (≥ 8), Presente (5–7) o No va (≤ 4). Es una sugerencia que el líder de eventos confirma.  
\- \*\*Audiencia objetivo estimada y meta de leads:\*\* de los asistentes totales, cuántos son público de esa vertical y cuántos leads se esperan.  
  
\#\#\# Presencia en los 22 países  
  
Dropi opera en 22 países (11 de LATAM como Dropi y 11 de Europa como Dropi Pro), así que todo hito tiene país y la app muestra la cobertura por país frente a su prioridad. Un hito digital (webinar, live) puede marcar varios países a la vez.  
  
| País | Marca | Estado | Prioridad sugerida para eventos |  
| --- | --- | --- | --- |  
| Colombia | Dropi | Mercado madre, sede en Cali | Alta |  
| México | Dropi | Segundo catálogo más grande | Alta |  
| Venezuela | Dropi | Lanzamiento reciente | Media-alta |  
| Chile, Ecuador, Perú, Panamá, Guatemala | Dropi | Consolidado o en expansión | Media |  
| Argentina, Paraguay, Costa Rica | Dropi | Expansión (Argentina con Droplatam) | Media-baja: digital primero |  
| España, Portugal | Dropi Pro | Mercados más maduros de Europa | Media |  
| Rumanía, Polonia, Hungría, Eslovenia, Eslovaquia, Croacia, Grecia, Bulgaria, República Checa | Dropi Pro | Operación | Baja: presencia digital |  
  
La prioridad es la propuesta del brief del área y se edita en el catálogo de países (junto con moneda, zona horaria y contacto local). La app alerta cuando un país de prioridad alta o media termina un trimestre sin ningún hito.  
  
\#\# 4. Ciclo de vida del hito  
  
Todo hito recorre 8 etapas; las etapas 2 a 6 son los 4 movilizadores, y cada una cierra con una compuerta que aprueba un rol concreto. La app muestra la etapa actual, quién debe actuar y qué falta para pasar.  
  
&\#91;embedded content: ciclo del hito · 8 etapas, 4 movilizadores\\\]  
  
Las cajas resaltadas son los 4 movilizadores; Radar, Evaluación y Cierre los enmarcan. El detalle de cada etapa está en la tabla.  
  
| \# | Etapa | Movilizador | Dueño | Entran | Entregables obligatorios (lo que la app captura) | Compuerta para avanzar | Plazo sugerido |  
| --- | --- | --- | --- | --- | --- | --- | --- |  
| 0 | Radar | — | Quien lo propone | Cualquier editor | Nombre, tipo, fechas, país, ciudad y venue, organizador, eje principal, asistentes estimados, costo estimado, link | Ficha completa | Al detectar la oportunidad |  
| 1 | Evaluación | — | Head del área | Transversal, Líder de eventos | Puntaje 1–5 en los 6 criterios (audiencia, mercado, mensaje, rol posible, costo por resultado, competencia); matriz de verticales con pertinencia, importancia, rol y meta de leads | Puntaje ≥ 18/30 y aprobación del Head | ≥ 30 días antes |  
| 2 | Datos | 1 · Datos | Datos | Transversal | Al menos una cifra validada por eje del hito (valor, unidad, fuente, fecha de corte, vigencia); línea base de leads de eventos similares | Datos marca la cifra como “validada para vocería” | ≥ 21 días antes |  
| 3 | Narrativa | 2 · Narrativa | Marketing y comunicaciones | Head, Transversal, Datos | Mensaje clave, vocero, audiencia, momento de la vocería, piezas (charla, one-pager, post, nota de prensa en borrador), plan de medios previsto | Head aprueba mensaje y vocero | ≥ 14 días antes |  
| 4 | Preparación | 3 · Eventos | Líder de eventos (Líder de impacto si es social) | Doer de eventos, verticales confirmadas | Concepto; stand: ancho × fondo (m), m², tipo, plano y renders; proveedores; presupuesto; cronograma de montaje; verticales y su personal; plan de captura por vertical (método, destino en el CRM, link UTM, código y QR, responsable, meta); checklist | Checklist crítico al 100% y plan de captura aprobado por vertical | ≥ 3 días antes |  
| 5 | Ejecución | 3 · Eventos | Líder de eventos | Doer, personal de las verticales, Marketing | Captura de leads en el CRM interno según el plan; asistencia real del organizador; vocería ejecutada (sí/no); fotos y video; incidencias | Fin del evento + asistencia real registrada | Durante |  
| 6 | Amplificación | 4 · Medios | Marketing y comunicaciones | Head, Datos | Publicaciones (prensa, LinkedIn, redes, rankings): medio, tipo (ganado, propio, pagado), URL, fecha, alcance, tono, competidores mencionados | Primera publicación ≤ 48 h tras el evento | 0–48 h después |  
| 7 | Cierre y medición | — | Datos | Transversal, Head, verticales | Resultados por vertical tomados del CRM (capturados, calificados, registros, activación a 30 días); costo real; costo por lead calificado; semáforo; 3 aprendizajes | Head o Transversal cierra el hito | ≤ 35 días después |  
  
\*\*Reglas del flujo:\*\*  
  
\- Las plantillas de entregables cambian por tipo de hito: una aparición en medios salta Preparación y Ejecución; una acción social agrega fundación aliada, beneficiarios, equipos entregados y acta.  
\- Un hito puede quedar \*\*En pausa\*\* o \*\*Descartado\*\* en cualquier etapa, con motivo obligatorio.  
\- Si una compuerta vence su plazo sugerido, el hito se marca en ámbar y se notifica al dueño y al transversal; si faltan menos de 7 días para el evento, pasa a rojo.  
\- Al aprobar una compuerta, la app notifica a quienes entran en la siguiente etapa con lo que les toca entregar.  
  
\#\# 5. Perfiles, roles y permisos  
  
Tres personas tienen control total: la CEO, el Head del área y el transversal. Cada líder edita su movilizador y lee el resto; Adriana solo ve lo que ejecuta y, en costos, únicamente el checklist de costos de sus hitos; los líderes de verticales entran con perfil Consulta. Los permisos se aplican en la base de datos (RLS de Supabase), no solo ocultando botones.  
  
| Rol | Persona hoy | Para qué entra a la app |  
| --- | --- | --- |  
| Administrador · CEO | CEO de Dropi | Control total, visión de todo el área |  
| Administrador · Head | John Jairo | Control total, aprueba compuertas y prioridades |  
| Administrador · Transversal | Jhonnathan Rueda | Control total, conecta los 4 frentes, gestiona usuarios y catálogos |  
| Líder de eventos | Jaqui | Conceptualiza eventos, stand y logística; aprueba la compuerta de Preparación |  
| Doer de eventos | Adriana | Ejecuta checklist, logística y checklist de costos en los hitos que tiene asignados |  
| Líder de impacto (social) | Sandra | Hitos del eje social: fundaciones, entregas, visitas, alianzas |  
| Marketing y comunicaciones | Harold | Narrativa y medios: mensajes, voceros, piezas, publicaciones |  
| Datos | Ricky | Cifras validadas, resultados de leads por vertical, cierre y medición |  
| Consulta | Líderes de verticales, directivos y otras áreas | Ver calendario: qué evento, fechas, país, ciudad, venue, eje, estado y verticales participantes |  
  
\*\*Matriz de permisos.\*\* E = crear y editar · A = aprobar compuerta · L = solo lectura · P = solo en hitos asignados o de su eje · — = sin acceso  
  
| Capacidad | Admin (CEO, Head, Transversal) | Líder eventos | Doer eventos | Líder impacto | MarCom | Datos | Consulta |  
| --- | --- | --- | --- | --- | --- | --- | --- |  
| Calendario y presencia por país | E | E | L | E (P) | L | L | L |  
| Crear hito / Radar | E | E | — | E (P) | E | — | — |  
| Evaluación y matriz de verticales | E, A | E | — | E (P) | L | L | — |  
| Etapa Datos | E, A | L | — | L | L | E, A | — |  
| Etapa Narrativa | E, A | L | — | L | E | L | — |  
| Preparación: stand, logística, checklist | E, A | E, A | E (P) | E, A (P) | L | — | — |  
| Checklist de costos (ítems, proveedor, valor) | E | E | E (P) | E (P) | — | L | — |  
| Presupuesto total y costo real del hito | E | E | — | E (P) | — | L | — |  
| Acciones sociales y fundaciones | E | L | — | E, A | L | L | — |  
| Amplificación y medios | E, A | L | — | L | E, A | L | — |  
| Plan de captura de leads por vertical | E, A | E | L (P) | E (P) | L | L | — |  
| Resultados de leads por vertical (cifras del CRM) | E | L | — | L (P) | L | E | — |  
| Cierre, semáforo y reportes | E, A | L | — | L | L | E | — |  
| Forzar avance de etapa (con motivo) | E | — | — | — | — | — | — |  
| Usuarios, roles y catálogos (países, verticales) | E | — | — | — | — | — | — |  
| Log de auditoría | L | — | — | — | — | L | — |  
  
\*\*Reglas de acceso:\*\*  
  
\- Un usuario tiene un solo rol base y puede tener asignaciones por hito (por ejemplo, Harold como responsable de un hito de medios).  
\- Adriana ve los ítems de costo del checklist de sus hitos (concepto, proveedor, valor, estado de pago), pero no el presupuesto total ni el costo real consolidado del hito.  
\- El perfil Consulta lee desde una vista sin costos, sin resultados de leads y sin notas internas; sí ve qué verticales participan, para que cada líder de vertical sepa dónde estará la suya.  
\- Forzar avance, borrar y cambiar roles quedan en el log de auditoría con usuario, fecha y motivo.  
  
\#\# 6. Medición: cómo se capturan los leads y qué se mide  
  
La app no captura leads: eso lo hace el CRM interno de Dropi. La app define, por cada evento y cada vertical, \*\*cómo\*\* se van a capturar (método, link, código, responsable, meta) y después guarda solo las cifras agregadas que entrega el CRM, para medir cada evento por sus leads reales y no por su aforo.  
  
\#\#\# Plan de captura por vertical  
  
En Preparación, cada vertical marcada como Protagonista o Presente debe tener su plan aprobado; sin él, la compuerta no pasa.  
  
| Campo | Qué se define | Ejemplo |  
| --- | --- | --- |  
| Vertical y rol | Protagonista o Presente | ROAX · Protagonista |  
| Audiencia objetivo estimada | Cuántos de los asistentes son público de la vertical | 2.000 de 100.000 |  
| Meta de leads calificados | Cifra comprometida con la vertical | 150 |  
| Método de captura | Formulario del CRM en tablet, QR a landing de registro, escaneo de escarapela, lista del organizador, reunión agendada, dinámica en stand | QR a landing de ROAX + tablet |  
| Destino en el CRM | Formulario, campaña o lista donde caen los leads | Formulario “Eventos ROAX” |  
| Link UTM y código de evento | Generados por la app con la convención de abajo; QR descargable | \`DESP26-ROAX\` |  
| Preguntas de calificación | Las que permiten clasificar A/B/C en el CRM | ¿Ya pautas en Meta Ads? |  
| Responsable en sitio | Persona de la vertical o del área que captura | Nombre |  
| Seguimiento | Quién contacta y en cuánto tiempo | Equipo ROAX, ≤ 48 h |  
  
\*\*Convención de atribución\*\* (la misma en todos los países, para que el CRM pueda agrupar por evento y vertical):  
  
\- \`utm\_source\` = slug del evento · \`utm\_medium\` = \`evento\` · \`utm\_campaign\` = año + slug · \`utm\_content\` = vertical · \`utm\_term\` = código de país ISO (CO, MX, ES…)  
\- Código de evento = 4 letras del evento + año + vertical, por ejemplo \`DESP26-ROAX\`, \`MODA26-PROV\`  
  
\#\#\# Definición de lead real (acordada con el CRM)  
  
El CRM cuenta como \*\*lead real\*\* a quien: es identificable (nombre y teléfono o correo), dio consentimiento de datos, declaró interés en una vertical presente, entró por el link, QR o código del evento dentro de su ventana, y no está duplicado. Si ya era usuario de Dropi, se reporta aparte como “existente”.  
  
\#\#\# Embudo por vertical  
  
| Nivel | Definición | Fuente |  
| --- | --- | --- |  
| Asistentes totales | Aforo o asistencia reportada por el organizador | Organizador (lo registra Eventos) |  
| Audiencia objetivo | Parte de los asistentes que es público de la vertical | Estimada en Evaluación, ajustada en Cierre |  
| Leads capturados | Registros con el código o UTM del evento y la vertical | CRM interno |  
| Leads calificados (A/B) | Leads reales con calificación A o B | CRM interno |  
| Registros en Dropi | Lead que se registró en la plataforma con el UTM o código | CRM / plataforma Dropi |  
| Activación a 30 días | Primera orden, primera campaña en ROAX, primer flujo en Chatea Pro, etc. | CRM / plataforma Dropi |  
  
Datos carga estas cifras por vertical en el Cierre (a mano en el MVP, por CSV exportado del CRM en fase 2). La app no guarda nombres, teléfonos ni correos.  
  
\*\*Ejemplo:\*\* un evento de 100.000 asistentes donde la audiencia objetivo de Proveedores es 2.000 personas. Si el CRM reporta 400 leads capturados y 180 calificados, la tasa de captura es 20% y la de calificación 45%; los 100.000 no entran en esas tasas.  
  
\#\#\# Calificación A/B/C por vertical  
  
Cada vertical define sus reglas en el catálogo de la app, como referencia para configurar el CRM. Ejemplos iniciales:  
  
\- \*\*Dropshippers:\*\* A = ya vende en línea; B = quiere empezar en menos de 30 días; C = curiosidad.  
\- \*\*Proveedores:\*\* A = fabricante o importador con inventario propio; B = distribuidor; C = sin producto.  
\- \*\*ROAX / Chatea Pro:\*\* A = tienda activa con pauta o volumen de pedidos; B = tienda nueva; C = sin tienda.  
\- \*\*Social:\*\* no se mide en leads comerciales sino en beneficiarios y alianzas.  
  
\#\#\# Fórmulas que calcula la app  
  
\- Tasa de captura = leads capturados / audiencia objetivo de la vertical  
\- Tasa de calificación = leads calificados (A+B) / leads capturados  
\- Cumplimiento de meta = leads calificados / meta de la vertical  
\- Costo por lead calificado = costo real del hito / leads calificados (repartido entre verticales según su participación en el costo, o en partes iguales si no se define)  
\- Activación = activados a 30 días / leads calificados  
  
\#\#\# KPIs por movilizador, eje y país  
  
| Nivel | KPI | Fuente en la app |  
| --- | --- | --- |  
| Datos | Cifras validadas y vigentes listas para vocería, por eje y país | Biblioteca de datos |  
| Narrativa | % de hitos con mensaje y vocero aprobados antes del evento | Compuerta de Narrativa |  
| Eventos | Leads calificados por vertical frente a su meta; % de eventos con plan de captura completo | Plan de captura + resultados |  
| Medios | Menciones ganadas y share of voice frente a Mastershop, Rocketfy y Triidy | Publicaciones |  
| Eje e-commerce | Activaciones desde eventos | Cierre |  
| Eje tecnología | Rankings logrados y contactos con founders / VCs | Hitos tipo ranking |  
| Eje gremios y gobierno | Afiliaciones y mesas activas, por país | Hitos tipo gremio |  
| Eje social | Alianzas RSE activas y beneficiarios | Acciones sociales |  
| Países | Países de prioridad alta y media con al menos un hito en el trimestre | Presencia por país |  
  
\*\*Semáforo trimestral\*\* (línea base Q4 2026): verde ≥ 90% de la meta, ámbar 60–89%, rojo \< 60%. Los umbrales son configurables por el administrador.  
  
\#\# 7. Módulos y requerimientos funcionales  
  
El MVP cubre lo que hace falta para operar el ciclo completo en los 22 países: hitos con etapas y compuertas, calendario y presencia por país, plan de captura por vertical, carga de resultados del CRM y tablero. Lo demás llega en la fase 2.  
  
| ID | Módulo | Requerimiento | Fase |  
| --- | --- | --- | --- |  
| RF-01 | Acceso | Inicio de sesión con Google y enlace mágico por correo, solo para correos invitados; sin registro abierto | MVP |  
| RF-02 | Acceso | Rol base por usuario y asignaciones por hito; permisos aplicados con RLS | MVP |  
| RF-03 | Inicio | Inicio por rol: “Lo que me toca” (tareas y compuertas pendientes), próximos 30 días, alertas ámbar y rojas | MVP |  
| RF-04 | Calendario | Vistas mes, semana y lista; filtros por país, región (LATAM / Europa), eje, tipo, vertical, ciudad, etapa y responsable; color por eje | MVP |  
| RF-05 | Calendario | Exportar a Google Calendar (.ics) | F2 |  
| RF-06 | Países | Catálogo de los 22 países: región, marca (Dropi / Dropi Pro), estado, prioridad, moneda, zona horaria, contacto local | MVP |  
| RF-07 | Países | Vista de presencia: hitos por país y trimestre frente a su prioridad; alerta de país prioritario sin hito | MVP |  
| RF-08 | Países | Mapa de presencia con los 22 países coloreados por número de hitos | F2 |  
| RF-09 | Hitos | Crear hito desde Radar con ficha mínima (incluye país o países); duplicar un hito de un año anterior | MVP |  
| RF-10 | Hitos | Pipeline tipo kanban con columnas por etapa; tarjeta con país y 4 puntos de progreso (Datos, Narrativa, Eventos, Medios) | MVP |  
| RF-11 | Hitos | Detalle con pestañas: Resumen, Evaluación, Datos, Narrativa, Evento, Captura, Social, Medios, Cierre, Actividad | MVP |  
| RF-12 | Compuertas | Plantillas de entregables por tipo de hito y etapa; campos obligatorios bloquean la compuerta | MVP |  
| RF-13 | Compuertas | Aprobar o devolver una compuerta con comentario; forzar avance solo Admin, con motivo | MVP |  
| RF-14 | Evaluación | Puntaje de los 6 criterios con total automático; matriz de verticales con rol sugerido y meta de leads | MVP |  
| RF-15 | Datos | Biblioteca de cifras: valor, unidad, eje, país, fuente, fecha de corte, vigencia, estado; se vincula a hitos | MVP |  
| RF-16 | Datos | Alerta cuando una cifra vinculada a un hito activo vence | F2 |  
| RF-17 | Narrativa | Mensaje clave, vocero, audiencia, momento y piezas adjuntas con estado | MVP |  
| RF-18 | Evento | Stand: ancho y fondo en metros con m² calculado, tipo, plano y renders; proveedores | MVP |  
| RF-19 | Evento | Checklist operativo con responsables, fechas e ítems críticos | MVP |  
| RF-20 | Costos | Checklist de costos (concepto, proveedor, valor, moneda, estado de pago) visible para el doer en sus hitos; presupuesto total y costo real solo para Admin, Líder de eventos, Líder de impacto y Datos | MVP |  
| RF-21 | Captura | Plan de captura por vertical presente: método, destino en el CRM, preguntas de calificación, responsable en sitio, seguimiento y meta | MVP |  
| RF-22 | Captura | Generar link UTM y código de evento por vertical con la convención de la sección 6, y QR descargable que apunta al destino del CRM | MVP |  
| RF-23 | Captura | Cargar resultados agregados por vertical (capturados, A/B/C, registros, activados a 30 días) a mano | MVP |  
| RF-24 | Captura | Cargar los mismos resultados desde un CSV exportado del CRM, agrupado por código de evento | F2 |  
| RF-25 | Captura | Traer resultados del CRM por API | F3 |  
| RF-26 | Social | Catálogo de fundaciones y aliados; por acción: tipo, beneficiarios, equipos entregados, acta y fotos | F2 |  
| RF-27 | Medios | Registro de publicaciones (medio, país, tipo, URL, fecha, alcance, tono, competidores) y contador de la ventana de 48 h | MVP |  
| RF-28 | Medios | Share of voice trimestral frente a competidores | F2 |  
| RF-29 | Reportes | Tablero: embudo por vertical, costo por lead calificado, KPIs por movilizador, eje y país, semáforo trimestral | MVP |  
| RF-30 | Reportes | Ficha de cierre del hito exportable a PDF | F2 |  
| RF-31 | Notificaciones | Correo y aviso en la app: tarea asignada, compuerta lista para aprobar, compuerta vencida, ventana de 48 h | MVP |  
| RF-32 | Notificaciones | Resumen semanal por correo a los administradores | F2 |  
| RF-33 | Administración | Usuarios e invitaciones, roles, ejes, países, verticales, voceros, tipos de hito, plantillas, reglas de calificación, umbrales | MVP |  
| RF-34 | Auditoría | Log de cambios de etapa, aprobaciones, forzados, borrados y cambios de rol | MVP |  
| RF-35 | Búsqueda | Buscador global por hito, país, ciudad, organizador, fundación o medio | F2 |  
  
\#\#\# Criterios de aceptación de los flujos clave  
  
\- \*\*Bloqueo de Narrativa sin dato:\*\* dado un hito en etapa Datos sin cifra validada, cuando Marketing intenta abrir Narrativa, la app lo impide y muestra “Falta 1 cifra validada para el eje E-commerce”.  
\- \*\*Plan de captura obligatorio:\*\* si una vertical está marcada Protagonista o Presente y no tiene plan aprobado, la compuerta de Preparación no pasa y la app dice cuál falta.  
\- \*\*Consulta no ve costos:\*\* un líder de vertical con perfil Consulta ve nombre, fechas, país, ciudad, venue, eje, estado y verticales participantes, y ningún costo, resultado o nota; la API tampoco devuelve esos campos.  
\- \*\*Costos del doer:\*\* Adriana ve los ítems del checklist de costos de sus hitos y no ve el presupuesto total ni el costo real, ni en pantalla ni en la API.  
\- \*\*País sin presencia:\*\* si un país de prioridad alta o media no tiene hitos en el trimestre a 30 días de su cierre, el transversal recibe una alerta.  
\- \*\*48 horas:\*\* al terminar el evento, Marketing ve una cuenta regresiva de 48 h; si vence sin publicación, el hito pasa a ámbar y se notifica al transversal.  
  
\#\# 8. Pantallas, UX y responsive  
  
La app es mobile-first para quien trabaja en el evento (checklist, costos, consulta rápida) y de escritorio para quien planea (pipeline, países, tablero). Cualquier persona debe saber el estado de un hito en un vistazo: la tarjeta siempre muestra país, etapa, semáforo y los 4 puntos de progreso.  
  
| Pantalla | Para quién | Contenido principal |  
| --- | --- | --- |  
| Inicio · Lo que me toca | Todos menos Consulta | Tareas y compuertas pendientes, próximos 30 días, alertas |  
| Calendario | Todos | Mes / semana / lista, filtros por país y región, color por eje; en móvil, lista por defecto |  
| Presencia por país | Admin, líderes | Los 22 países con prioridad, hitos del trimestre y alerta de país sin presencia |  
| Pipeline | Editores | Kanban por etapa; en móvil, una columna con selector de etapa |  
| Detalle de hito | Editores | Encabezado con país, etapa, semáforo, fechas y ciudad; barra de 4 movilizadores; pestañas por módulo; botón “Aprobar compuerta” |  
| Captura del hito | Eventos, Datos, Admin | Plan por vertical, links UTM, códigos y QR; resultados del CRM y embudo por vertical |  
| Checklist de costos | Doer, líderes, Admin | Ítems de costo con proveedor, valor y estado de pago |  
| Biblioteca de datos | Datos, Admin, lectura otros | Cifras por eje y país con estado y vigencia |  
| Tablero del área | Admin, líderes | KPIs por movilizador, eje y país; embudo; costo por lead; semáforo trimestral |  
| Vista de consulta | Consulta (incluye líderes de verticales) | Calendario y tarjetas con nombre, fechas, país, lugar, eje, estado y verticales |  
| Administración | Admin | Usuarios e invitaciones, roles, catálogos, plantillas, umbrales |  
  
\*\*Principios de UX:\*\*  
  
\- Navegación: barra lateral en escritorio; barra inferior de 4 accesos en móvil (Inicio, Calendario, Hitos, Países).  
\- Una acción principal por pantalla, en naranja; las secundarias, en contorno.  
\- Lo que falta para la compuerta se lista arriba del detalle, con enlace directo al campo.  
\- Formularios largos se guardan solos cada pocos segundos; nada se pierde si se cierra la pestaña.  
\- Estados vacíos con la acción siguiente (“Aún no hay cifra validada. Pide una a Datos”).  
\- Puntos de quiebre: 360, 768, 1024 y 1440 px. Objetivos táctiles de al menos 44 × 44 px.  
\- Idioma español; fechas en formato “13–15 nov”; cada hito muestra la hora en la zona de su país y, al lado, la hora de Bogotá.  
  
\#\# 9. Identidad visual y tokens de diseño  
  
La app usa la identidad de la presentación del área: fondo casi negro, degradado naranja de \#FF6F20 a \#FF9D38 con brillo, tipografía Inter y tarjetas redondeadas. El modo oscuro es el único en el MVP.  
  
| Token | Valor | Uso |  
| --- | --- | --- |  
| \`bg\` | \#0D0D0D | Fondo de la app |  
| \`bg-deep\` | \#050505 | Fondo de pantalla completa, overlays |  
| \`surface\` | \#111111 | Tarjetas |  
| \`surface-raised\` | \#141414 | Tarjeta destacada, encabezados |  
| \`surface-muted\` | \#1A1A1A | Chips neutros, inputs |  
| \`border\` | \#262626 | Bordes de tarjeta |  
| \`border-strong\` | \#333333 | Separadores, bordes de chip |  
| \`text\` | \#F4F4F4 | Texto principal |  
| \`text-soft\` | \#D4D4D4 | Texto de apoyo |  
| \`text-muted\` | \#A3A3A3 | Descripciones, metadatos |  
| \`text-faint\` | \#737373 | Solo etiquetas ≥ 18 px (contraste ≈ 4:1 sobre el fondo) |  
| \`disabled\` | \#525252 | Hitos pasados, estados inactivos |  
| \`brand\` | \#FF6F20 | Acción principal, bordes activos |  
| \`brand-light\` | \#FF9D38 | Eyebrows, números, chips de eje |  
| \`brand-gradient\` | linear-gradient(90deg, \#FF6F20, \#FF9D38) | Botones principales, números grandes, línea de tiempo |  
| \`brand-tint\` | rgba(255,111,32,0.12) con borde rgba(255,157,56,0.35) | Chips de eje, avisos |  
| \`glow\` | 0 0 24px rgba(255,111,32,0.5) | Avatar, punto de etapa activa |  
| \`radial-accent\` | radial-gradient(circle at 100% 0%, rgba(255,111,32,0.20), transparent 60%) | Fondo de tarjetas destacadas |  
| \`red\` / \`amber\` / \`green\` | \#EF4444 / \#F59E0B / \#22C55E | Semáforo |  
  
\*\*Tipografía:\*\* Inter 400, 500, 600 y 700. Eyebrow: 12–14 px, 600, mayúsculas, tracking 0.12 em, color \`brand-light\`. Títulos: 700 con tracking negativo (−2%). Cuerpo: 14–16 px, 400.  
  
\*\*Forma:\*\* radios de 12 px (inputs), 16 px (avisos), 24 px (tarjetas) y 999 px (chips y botones de píldora). Avatares circulares con iniciales sobre el degradado, como en la lámina del equipo.  
  
\*\*Iconos:\*\* Lucide, trazo 2, que son los mismos de la presentación: \`database\` (Datos), \`message-circle\` (Narrativa), \`users\` (Eventos), \`send\` (Medios).  
  
\*\*Logo:\*\* el SVG de Dropi de la presentación (isotipo + logotipo en \#F4F4F4) va en \`public/brand/\`, en versión clara y en isotipo solo para el favicon y el ícono de la PWA.  
  
\`\`\`ts  
// tailwind.config.ts (extracto)  
theme: {  
 extend: {  
 colors: {  
 bg: { DEFAULT: '\#0D0D0D', deep: '\#050505' },  
 surface: { DEFAULT: '\#111111', raised: '\#141414', muted: '\#1A1A1A' },  
 line: { DEFAULT: '\#262626', strong: '\#333333' },  
 ink: { DEFAULT: '\#F4F4F4', soft: '\#D4D4D4', muted: '\#A3A3A3', faint: '\#737373', off: '\#525252' },  
 brand: { DEFAULT: '\#FF6F20', light: '\#FF9D38' },  
 sem: { red: '\#EF4444', amber: '\#F59E0B', green: '\#22C55E' },  
 },  
 fontFamily: { sans: \['Inter', 'Arial', 'sans-serif'\] },  
 borderRadius: { card: '24px', box: '16px' },  
 boxShadow: { glow: '0 0 24px rgba(255,111,32,0.5)' },  
 backgroundImage: { 'brand-gradient': 'linear-gradient(90deg,\#FF6F20 0%,\#FF9D38 100%)' },  
 },  
}  
\`\`\`  
  
\#\# 10. Arquitectura técnica  
  
Una sola app Next.js (App Router, TypeScript) desplegada en Vercel, con Supabase como backend: Postgres con RLS, autenticación, Storage para planos y fotos, y Edge Functions para tareas programadas. Por ahora todo vive en tus cuentas personales de GitHub, Supabase y Vercel, porque es un proyecto tuyo; más abajo está cómo pasarlo a cuentas de Dropi si se adopta.  
  
| Capa | Elección | Para qué |  
| --- | --- | --- |  
| Frontend | Next.js (App Router, última versión estable), React, TypeScript | Páginas por rol, Server Components y Server Actions |  
| Estilos y UI | Tailwind CSS + shadcn/ui (Radix), Lucide | Componentes accesibles con los tokens de la sección 9 |  
| Formularios | React Hook Form + Zod | Validación compartida entre cliente y servidor |  
| Calendario | FullCalendar (o vista propia en lista para móvil) | Mes, semana y lista |  
| Kanban | dnd-kit | Arrastrar hitos entre etapas (valida compuerta en el servidor) |  
| Gráficos y mapa | Recharts; mapa SVG de países en fase 2 | Embudo, KPIs, semáforo, presencia |  
| Base de datos | Supabase Postgres con RLS | Datos, permisos por rol y vistas por perfil |  
| Autenticación | Supabase Auth: Google + enlace mágico, solo correos invitados | Sin contraseñas propias |  
| Archivos | Supabase Storage, buckets privados con URLs firmadas | Planos de stand, renders, actas, fotos |  
| Tareas programadas | Supabase Edge Functions + pg\\\_cron | Alertas de compuertas, ventana de 48 h, países sin presencia |  
| Correo | Resend | Notificaciones e invitaciones |  
| UTM y QR | Función propia + librería \`qrcode\` | Links, códigos y QR del plan de captura |  
| Hosting | Vercel (producción + previews por PR) | Despliegue continuo desde GitHub |  
| Calidad | GitHub Actions: lint, typecheck, pruebas (Vitest + Playwright), pruebas de RLS | Bloquear merges rotos |  
  
\#\#\# Estructura del repositorio  
  
\`\`\`text  
tejido/  
├─ app/  
│ ├─ (auth)/login/  
│ ├─ (app)/inicio/ \# Lo que me toca  
│ ├─ (app)/calendario/  
│ ├─ (app)/paises/ \# presencia por país  
│ ├─ (app)/hitos/ \# pipeline  
│ ├─ (app)/hitos/\[id\]/ \# detalle con pestañas  
│ ├─ (app)/datos/  
│ ├─ (app)/tablero/  
│ ├─ (app)/consulta/ \# vista del perfil Consulta  
│ └─ (app)/admin/  
├─ components/ (ui/, hitos/, captura/, charts/)  
├─ lib/ (supabase/, auth/, permisos.ts, kpis.ts, utm.ts)  
├─ supabase/  
│ ├─ migrations/ \# SQL versionado  
│ ├─ functions/ \# edge functions  
│ └─ seed.sql \# catálogos, 22 países, hitos Q4 2026  
├─ public/brand/ \# logo e isotipo Dropi  
├─ tests/ (unit/, e2e/, rls/)  
└─ .github/workflows/ (ci.yml, backup.yml)  
\`\`\`  
  
\#\#\# Despliegue en tus cuentas personales  
  
1\. Crear el repositorio privado \`tejido\` en tu cuenta personal de GitHub, con ramas \`main\` (producción) y \`develop\`.  
2\. Crear en tu organización personal de Supabase dos proyectos: \`tejido-staging\` y \`tejido-prod\`. El plan gratuito permite 2 proyectos activos y pausa los que tienen poca actividad durante una semana (\[Supabase\](https://supabase.com/docs/guides/platform/free-project-pausing)).  
3\. Aplicar migraciones con la CLI de Supabase (\`supabase db push\`) desde GitHub Actions; un segundo workflow hace \`pg\_dump\` semanal como respaldo.  
4\. Crear un cliente OAuth de Google en un proyecto personal de Google Cloud y configurarlo en Supabase Auth. Como no hay dominio corporativo que restringir, el acceso se controla con una tabla de invitaciones: solo entra quien el Admin invitó por correo.  
5\. Importar el repositorio en tu cuenta de Vercel; \`main\` despliega a producción y cada PR a una vista previa conectada a staging.  
6\. Cargar variables de entorno en Vercel: \`NEXT\_PUBLIC\_SUPABASE\_URL\`, \`NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY\`, \`SUPABASE\_SERVICE\_ROLE\_KEY\` (solo servidor), \`RESEND\_API\_KEY\`, \`NEXT\_PUBLIC\_APP\_URL\`.  
7\. Cargar \`seed.sql\` con ejes, movilizadores, etapas, 22 países, verticales, plantillas y los hitos de Q4 2026; invitar a las 8 personas del área y a los perfiles Consulta.  
8\. Usar el dominio gratuito \`\*.vercel.app\` mientras sea piloto.  
  
\*\*Ojo con los planes gratuitos:\*\* el plan Hobby de Vercel es solo para uso personal y no comercial (\[Vercel\](https://vercel.com/docs/accounts/plans/hobby)), y una herramienta interna de una empresa probablemente no encaja ahí. Para el piloto conviene usar el plan Pro de Vercel. También conviene pasar Supabase a Pro si la app pasa una semana sin uso, porque el plan gratuito la pausaría.  
  
\#\#\# Paso a cuentas de Dropi (si se adopta)  
  
1\. Transferir el repositorio de GitHub a la organización de Dropi (conserva historial, issues y PRs).  
2\. Transferir los proyectos de Supabase a una organización de Dropi desde la configuración del proyecto; la URL y los datos se mantienen.  
3\. Transferir el proyecto de Vercel al equipo de Dropi y conectar un dominio como \`tejido.dropi.co\`.  
4\. Cambiar el cliente OAuth al Google Workspace de Dropi y restringir el acceso al dominio; rotar todas las llaves.  
  
\*\*Reglas técnicas:\*\* la llave \`service\_role\` nunca llega al navegador; toda escritura pasa por Server Actions o por RLS; el avance de etapa se valida en una función SQL (\`avanzar\_etapa\`) para que nadie salte una compuerta desde el cliente.  
  
\#\# 11. Modelo de datos y seguridad (RLS)  
  
El modelo gira en torno a \`hitos\`; cada etapa, entregable, plan de captura y publicación cuelga de un hito, y cada hito tiene uno o varios países. La base no guarda datos personales de leads, solo cifras agregadas por vertical. Todas las tablas tienen RLS activado.  
  
| Tabla | Campos clave | Notas |  
| --- | --- | --- |  
| \`profiles\` | id (= auth.users.id), nombre, email, rol, activo | Rol base del usuario |  
| \`invitaciones\` | email, rol, invitado\\\_por, aceptada\\\_en | Solo entra quien está invitado |  
| \`paises\` | codigo ISO, nombre, region (LATAM / Europa), marca (Dropi / Dropi Pro), estado, prioridad, moneda, zona\\\_horaria, contacto\\\_local | 22 filas semilla |  
| \`ejes\` | id, nombre, color, kpi | 4 filas |  
| \`movilizadores\` | id, nombre, orden | 4 filas, orden 1–4 |  
| \`etapas\` | id, nombre, orden, movilizador\\\_id, rol\\\_aprobador | 8 filas (0–7) |  
| \`verticales\` | id, nombre, slug, responsable, reglas\\\_calificacion (jsonb), activa | Catálogo editable |  
| \`hitos\` | id, nombre, slug, tipo, eje\\\_id, ejes\\\_secundarios\\\[\\\], fecha\\\_inicio, fecha\\\_fin, ciudad, venue, organizador, url, asistentes\\\_estimados, asistentes\\\_reales, moneda, etapa\\\_id, estado, semaforo, responsable\\\_id, puntaje\\\_evaluacion | Estado: activo, en\\\_pausa, descartado, cerrado |  
| \`hito\_paises\` | hito\\\_id, pais\\\_codigo, principal | Uno o varios países por hito |  
| \`hito\_asignaciones\` | hito\\\_id, user\\\_id, funcion | Quienes trabajan el hito (Adriana ve solo los suyos) |  
| \`hito\_verticales\` | hito\\\_id, vertical\\\_id, pertinencia, importancia, rol, audiencia\\\_objetivo, meta\\\_leads, participacion\\\_costo | Matriz de pertinencia |  
| \`hito\_etapas\` | hito\\\_id, etapa\\\_id, estado, abierta\\\_en, vence\\\_en, aprobada\\\_por, aprobada\\\_en, forzada, motivo | Historial de compuertas |  
| \`plantillas\_entregables\` | tipo\\\_hito, etapa\\\_id, nombre, campo, obligatorio, critico | Qué se captura en cada etapa |  
| \`entregables\` | hito\\\_id, plantilla\\\_id, valor (jsonb), archivo\\\_path, responsable\\\_id, vence\\\_en, completo | Instancia por hito |  
| \`cifras\` | id, eje\\\_id, pais\\\_codigo, enunciado, valor, unidad, fuente, fecha\\\_corte, vigente\\\_hasta, estado, validada\\\_por | Biblioteca de datos |  
| \`hito\_cifras\` | hito\\\_id, cifra\\\_id | Cifras usadas en el hito |  
| \`narrativas\` | hito\\\_id, mensaje\\\_clave, vocero\\\_id, audiencia, momento, aprobada | Una por hito |  
| \`voceros\` | id, nombre, cargo, temas\\\[\\\] | Catálogo |  
| \`stands\` | hito\\\_id, ancho\\\_m, fondo\\\_m, m2 (calculado), tipo, plano\\\_path, renders\\\[\\\] | Solo eventos |  
| \`costos\_items\` | hito\\\_id, concepto, proveedor, valor, moneda, estado\\\_pago, responsable\\\_id | Checklist de costos (visible para el doer) |  
| \`presupuestos\` | hito\\\_id, presupuesto\\\_total, costo\\\_real | Oculto para doer y Consulta |  
| \`planes\_captura\` | hito\\\_id, vertical\\\_id, metodo, destino\\\_crm, preguntas, responsable, seguimiento\\\_horas, meta, aprobado | Uno por vertical presente |  
| \`canales\_captura\` | plan\\\_id, codigo, url\\\_destino, utm (jsonb), qr\\\_path | Link, código y QR |  
| \`resultados\_leads\` | hito\\\_id, vertical\\\_id, capturados, calif\\\_a, calif\\\_b, calif\\\_c, existentes, registros, activados\\\_30d, fuente (manual / csv / api), cargado\\\_por, cargado\\\_en | Cifras agregadas del CRM |  
| \`aliados\` | id, nombre, tipo (fundación, gremio, gobierno, medio), pais\\\_codigo, contacto | Social y gremios |  
| \`acciones\_sociales\` | hito\\\_id, aliado\\\_id, tipo, beneficiarios, equipos\\\_entregados, acta\\\_path | Eje social |  
| \`publicaciones\` | hito\\\_id, medio, pais\\\_codigo, tipo, url, fecha, alcance, tono, competidores\\\[\\\] | Medios |  
| \`kpi\_metas\` | trimestre, nivel (movilizador / eje / vertical / país), clave, meta, real | Semáforo |  
| \`actividad\` | id, user\\\_id, entidad, entidad\\\_id, accion, antes, despues, creado\\\_en | Auditoría, solo inserción |  
| \`notificaciones\` | user\\\_id, tipo, hito\\\_id, leida, creado\\\_en | Avisos en la app |  
  
\#\#\# Seguridad: ejemplos de políticas  
  
\`\`\`sql  
create type rol\_app as enum (  
 'admin','lider\_eventos','doer\_eventos','lider\_impacto',  
 'marcom','datos','consulta'  
);  
  
create function public.mi\_rol() returns rol\_app  
language sql stable security definer set search\_path = public as $$  
 select rol from profiles where id = auth.uid()  
$$;  
  
\-- Checklist de costos: el doer solo ve los ítems de sus hitos.  
alter table costos\_items enable row level security;  
create policy costos\_lectura on costos\_items for select using (  
 mi\_rol() in ('admin','lider\_eventos','datos')  
 or (mi\_rol() in ('doer\_eventos','lider\_impacto') and exists (  
 select 1 from hito\_asignaciones a  
 where a.hito\_id = costos\_items.hito\_id and a.user\_id = auth.uid()  
 ))  
);  
  
\-- Presupuesto total: nunca para doer ni consulta.  
alter table presupuestos enable row level security;  
create policy presupuesto\_lectura on presupuestos for select using (  
 mi\_rol() in ('admin','lider\_eventos','lider\_impacto','datos')  
);  
  
\-- El perfil Consulta (incluye líderes de verticales) lee solo esta vista:  
\-- corre con permisos de su dueño y expone únicamente estas columnas;  
\-- consulta no tiene select sobre las tablas base.  
create view v\_calendario as  
 select h.id, h.nombre, h.tipo, h.fecha\_inicio, h.fecha\_fin,  
 hp.pais\_codigo, h.ciudad, h.venue, e.nombre as eje, h.estado,  
 array\_agg(v.nombre) filter (where hv.rol \<\> 'no\_va') as verticales  
 from hitos h  
 join ejes e on e.id = h.eje\_id  
 left join hito\_paises hp on hp.hito\_id = h.id and hp.principal  
 left join hito\_verticales hv on hv.hito\_id = h.id  
 left join verticales v on v.id = hv.vertical\_id  
 where h.estado \<\> 'descartado'  
 group by h.id, hp.pais\_codigo, e.nombre;  
\`\`\`  
  
\#\#\# Datos semilla: hitos de Q4 2026  
  
| Fecha | Hito | País · lugar | Eje | Etapa inicial |  
| --- | --- | --- | --- | --- |  
| 12–20 dic | Plaza de Wein (fecha por confirmar con el organizador) | Colombia · Medellín | E-commerce | Evaluación |  
| 28 nov | Modo Ascenso | Colombia · Cali, Icesi | Tecnología | Narrativa |  
| 26 nov | Elevate (comunidad Ecomwom) | Colombia · CESA | Social | Narrativa |  
| 24 nov | Leyendas | Por confirmar | Social | Narrativa |  
| 22 nov | Finfest (Dropi Pay y Confio) | Por confirmar | Tecnología | Narrativa |  
| 13–15 nov | Despega | Colombia · Zonamerica | E-commerce | Amplificación |  
| 28–30 oct | Labs Summit | Colombia · Tuluá | E-commerce | Cierre |  
| 24 oct | Revista Semana | Colombia · medio | E-commerce | Cierre |  
  
También entran como hitos sociales la entrega de computadores con la fundación de Taliana Vargas y la visita académica de una fundación de estudiantes (fechas por definir), y como hitos permanentes la membresía CCCE, la agencia de PR y Black Friday. Las etapas iniciales son una propuesta; el equipo las ajusta al cargar.  
  
\#\# 12. Requerimientos no funcionales  
  
| Área | Requisito |  
| --- | --- |  
| Responsive | Funciona completo de 360 px a 1440 px+; checklist y costos pensados primero para celular |  
| Rendimiento | LCP \< 2,5 s en 4G para Inicio, Calendario y Detalle de hito |  
| Seguridad | RLS en todas las tablas; \`service\_role\` solo en servidor; buckets privados con URLs firmadas; acceso solo por invitación |  
| Datos personales | La app no guarda nombres, teléfonos ni correos de leads; solo cifras agregadas. Los datos personales y el consentimiento viven en el CRM interno |  
| Accesibilidad | WCAG 2.1 AA: contraste ≥ 4,5:1 en texto normal, foco visible en naranja, navegación por teclado, etiquetas en todos los campos |  
| Auditoría | Log inmutable de etapas, aprobaciones, forzados, borrados y cambios de rol |  
| Respaldo | \`pg\_dump\` semanal automático desde GitHub Actions mientras se esté en plan gratuito; restauración probada antes de salir a producción |  
| Multipaís | 22 países con moneda y zona horaria propias; costos en la moneda del país con conversión a COP y USD para el tablero |  
| Calidad | CI obligatorio en cada PR: lint, typecheck, pruebas unitarias, e2e de los flujos clave y pruebas de RLS por rol |  
| Idioma | Español en la interfaz; los hitos de Dropi Pro en Europa usan el mismo idioma de trabajo interno |  
  
\#\# 13. Plan de entrega por fases  
  
Sin captura de leads dentro de la app, el MVP se reduce: unas 5 semanas con un desarrollador full-stack, para operar desde enero de 2027 (Colombiatex). Las semanas son una estimación para validar con quien desarrolle.  
  
| Fase | Duración | Alcance | Criterio para pasar |  
| --- | --- | --- | --- |  
| 0 · Base | 1 semana | Repo, Supabase y Vercel en tus cuentas, CI, auth con invitaciones, roles, tokens de marca, layout responsive | Login funcionando en preview con las 8 personas del área |  
| 1 · MVP | 4 semanas | Catálogo de 22 países y vista de presencia, hitos, pipeline, detalle, compuertas, evaluación y matriz de verticales, datos, narrativa, stand y checklist, checklist de costos, plan de captura con UTM / código / QR, carga manual de resultados, publicaciones con 48 h, tablero básico, notificaciones, auditoría, vista Consulta | Un hito real recorre las 8 etapas y su cierre muestra leads calificados por vertical y país |  
| 2 · Operación completa | 3 semanas | Módulo social, carga de resultados por CSV del CRM, mapa de países, semáforo trimestral, share of voice, ficha PDF, .ics, resumen semanal, buscador | El reporte de Q1 2027 sale de la app sin hojas externas |  
| 3 · Integraciones y paso a Dropi | Por definir | API con el CRM interno, transferencia de cuentas a Dropi (sección 10), dominio corporativo | Aprobación del área para adoptarla |  
  
\*\*Orden recomendado dentro del MVP:\*\* modelo de datos y RLS → hitos, países y pipeline → compuertas → plan de captura y costos → calendario y vista Consulta → tablero.  
  
\#\# 14. Supuestos, riesgos y preguntas abiertas  
  
\*\*Decisiones tomadas (16 nov 2026):\*\*  
  
\- La app no captura leads; define cómo los captura el CRM interno por evento y vertical, y guarda solo resultados agregados.  
\- Cubre los 22 países donde opera Dropi, con prioridad por país.  
\- Control total: CEO, Head del área y transversal. Los líderes de verticales tienen perfil Consulta.  
\- Adriana ve solo el checklist de costos de sus hitos, no el presupuesto total.  
\- Repositorio, Supabase y Vercel en las cuentas personales de Jhonnathan Rueda; se transfieren a Dropi si el área adopta la app.  
  
\*\*Supuestos:\*\* “Droppy” es Dropi, “su pavés” es Supabase y “githat” es GitHub. El perfil Consulta ve qué verticales participan en cada evento, para que cada líder sepa dónde estará la suya.  
  
| Riesgo | Efecto | Mitigación |  
| --- | --- | --- |  
| El equipo sigue en chats y hojas | La app queda vacía y los KPIs no sirven | Cargar los hitos de Q4 en la semilla; las compuertas solo se aprueban dentro de la app |  
| Plan Hobby de Vercel para uso no comercial | Un uso interno de empresa puede incumplir sus términos | Usar Vercel Pro desde el piloto, o transferir a una cuenta de Dropi |  
| Pausa del plan gratuito de Supabase | La app deja de responder tras una semana sin uso | Pasar a Supabase Pro antes de producción; respaldo semanal con \`pg\_dump\` |  
| El CRM no etiqueta por código de evento y vertical | No se pueden medir leads reales por vertical | Acordar la convención UTM / código con quien administra el CRM antes del primer evento |  
| Cuentas personales | Si la persona sale del proyecto, el acceso queda atado a ella | Documentar la transferencia (sección 10) y dar acceso de administrador a un segundo responsable |  
| Compuertas demasiado rígidas | El equipo las salta o se frena | Plantillas por tipo de hito y forzado con motivo para Admin |  
  
\*\*Preguntas abiertas:\*\*  
  
\- \[ \] ¿Quién administra el CRM interno y puede etiquetar leads por código de evento y vertical?  
\- \[ \] ¿Cómo se reconoce hoy en la plataforma Dropi un registro que llegó con UTM o código de evento?  
\- \[ \] ¿Cuál es el listado oficial de verticales y quién lidera cada una?  
\- \[ \] ¿Quién es el contacto de eventos en cada país, sobre todo en México, Venezuela y España?  
\- \[ \] ¿Se confirma la prioridad por país propuesta en la sección 3?  
\- \[ \] ¿Quién más, fuera del área, necesita el perfil Consulta?  
\- \[ \] ¿Cuáles son las metas trimestrales por eje, vertical y país para 2027?  
\- \[ \] ¿Se confirman la fecha de Plaza de Wein y las ciudades de Finfest y Leyendas?  
  
\#\# Fuentes  
  
\- Presentación “Dropi · Área de PR, Ecosistema y Eventos” (HTML adjunto): ejes, movilizadores, equipo, ciclo, agenda Q4 2026 y métricas.  
\- Doc del proyecto “Dropi — Brief de Eventos y Presencia de Marca” (25 oct 2026): verticales, 22 países y prioridades, filtro de 6 criterios, KPIs por tipo de evento y competidores.  
\- \[Vercel · Hobby plan\](https://vercel.com/docs/accounts/plans/hobby): restricción a uso personal no comercial.  
\- \[Supabase · Project pausing\](https://supabase.com/docs/guides/platform/free-project-pausing) y \[precios\](https://supabase.com/pricing): pausa por inactividad y límite de proyectos del plan gratuito.  
