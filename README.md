# Tejido · App de PR, Eventos y Ecosistema Dropi

Implementación del MVP (fases 0 y 1) del [PRD](./PRD.md): cada hito pasa por **Datos → Narrativa → Eventos → Medios**, en ese orden,
con compuertas validadas en la base de datos, plan de captura de leads por vertical y medición por leads reales (no por aforo)
en los 22 países donde opera Dropi.

Next.js 15 (App Router) · Supabase (Postgres + RLS + Auth + Storage) · Tailwind · Vercel.

## Qué incluye

| PRD | Estado |
| --- | --- |
| RF-01/02 Acceso por invitación (Google + enlace mágico), roles y RLS | ✅ trigger `handle_new_user` bloquea correos no invitados; permisos en `public.puede()` |
| RF-03 Inicio "Lo que me toca" | ✅ |
| RF-04 Calendario mes/semana/lista con 8 filtros y color por eje | ✅ (`.ics` es F2) |
| RF-06/07 Catálogo de 22 países y presencia por trimestre | ✅ (mapa SVG es F2) |
| RF-09/10/11 Hitos: Radar, duplicar, kanban, detalle con pestañas | ✅ |
| RF-12/13 Plantillas y compuertas; aprobar, devolver y forzar con motivo | ✅ `avanzar_etapa()` en SQL |
| RF-14 Evaluación de 6 criterios y matriz de verticales | ✅ rol sugerido ≥8 / 5–7 / ≤4, lo confirma el líder |
| RF-15 Biblioteca de cifras | ✅ (alerta de vencimiento es F2) |
| RF-17..20 Narrativa, stand (m² calculado), checklist, costos y presupuesto | ✅ planos y renders en Storage privado |
| RF-21..23 Plan de captura, UTM + código + QR, resultados manuales | ✅ convención `DESP26-ROAX` |
| RF-27 Publicaciones y ventana de 48 h | ✅ |
| RF-29 Tablero: embudo, costo por lead, KPIs, semáforo | ✅ |
| RF-31 Notificaciones en app y correo (Resend) | ✅ |
| RF-33/34 Administración y log inmutable | ✅ |
| F2: CSV del CRM, social con catálogo propio, share of voice, PDF, `.ics`, resumen semanal, buscador | ⏳ |
| F3: API del CRM, transferencia a Dropi | ⏳ ver PRD §10 |

## Cómo funciona la seguridad

- **Toda la matriz de permisos del PRD §5 está en `public.puede(hito, modulo, 'r'|'w')`** (`supabase/migrations/0002_funciones.sql`). Las políticas RLS la llaman; `lib/permisos.ts` solo la espeja para ocultar botones.
- El perfil **Consulta** no tiene `select` sobre ninguna tabla: lee la vista `v_calendario`, que expone solo nombre, fechas, países, ciudad, venue, eje, estado y verticales.
- **Adriana (doer)** lee los ítems de costo de *sus* hitos y nunca `presupuestos` (el costo estimado del Radar vive ahí, no en `hitos`).
- El avance de etapa, el cierre y el semáforo **no se pueden escribir desde el cliente** (trigger `hito_proteger`): solo `avanzar_etapa()`.
- El log `actividad` es de solo inserción (trigger) y lo alimentan triggers; forzados, borrados y cambios de rol exigen motivo.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en servidor (`lib/supabase/admin.ts`, ruta del cron).
- La app no guarda datos personales de leads: solo cifras agregadas por vertical.

## Puesta en marcha (PRD §10)

1. **Supabase**: crea `tejido-staging` y `tejido-prod`. Aplica `supabase/migrations/*.sql` en orden (o `supabase db push`) y luego `supabase/seed.sql`.
2. **Primer administrador** (la tabla de invitaciones empieza vacía; sin esto nadie puede entrar). En el SQL editor:
   ```sql
   insert into invitaciones (email, rol, nombre) values ('tu-correo@…', 'admin', 'Tu nombre');
   ```
   Después invita al resto desde **Admin → Usuarios** (CEO, Head, Jaqui, Adriana, Sandra, Harold, Ricky y los perfiles Consulta).
3. **Auth**: en Supabase → Authentication activa Google (cliente OAuth de Google Cloud) y el enlace mágico; agrega `https://<tu-app>/auth/callback` a las URL permitidas.
4. **Variables** (ver `.env.example`) en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`.
5. **Tareas programadas**: la migración `0004` agenda `tareas_programadas()` cada hora con `pg_cron` si la extensión existe. `vercel.json` llama a `/api/cron/notificar` (con `CRON_SECRET`) para refrescar semáforos y **enviar los correos pendientes**.
6. **Vercel**: importa el repo; `main` → producción, cada PR → vista previa. Ojo: el plan Hobby es solo para uso personal no comercial; para el piloto conviene Pro (PRD §10).
7. **Storage**: la migración `0003` crea el bucket privado `archivos` con políticas por hito (se aplica solo si existe el esquema `storage`).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completa con tu proyecto Supabase
npm run dev
```

```bash
npm run lint && npm run typecheck && npm test   # unidad: fórmulas del PRD §6, UTM, fechas
npm run test:rls                                # Postgres temporal: migraciones + semilla + permisos y compuertas por rol
```

`npm run test:rls` necesita los binarios de PostgreSQL (`initdb`, `pg_ctl`, `psql`); en Ubuntu: `apt install postgresql`.
Prueba, entre otras cosas: correo no invitado rechazado, Consulta sin costos, doer sin presupuesto, bloqueo de Narrativa sin cifra
("Falta 1 cifra validada para el eje E-commerce"), plan de captura obligatorio, forzar solo Admin con motivo, semáforo ámbar/rojo,
alerta de país sin hitos y log inmutable.

## Decisiones y desviaciones del PRD (revísalas)

- **Gate de Amplificación**: exige *al menos una* publicación; que sea ≤ 48 h se mide como KPI y, si vence la ventana, el hito pasa a ámbar. Así una publicación tardía no deja el hito bloqueado para siempre.
- **Semilla**: los hitos Q4 y su etapa inicial son la propuesta del PRD. "Por confirmar" (país/ciudad de Leyendas y Finfest) quedó en Colombia sin ciudad; ajústalo. Fechas de las dos acciones sociales sin fecha: placeholder 15 dic marcado "por confirmar".
- **Tasas de cambio** (`monedas`) son referenciales: actualízalas en Admin → Monedas.
- **Formularios**: Server Actions con validación Zod en los flujos críticos y `FormData` nativo en el resto (no React Hook Form) para mantener los formularios autoguardables simples.
- **Calendario propio** (mes/semana/lista) en lugar de FullCalendar: menos peso y lista por defecto en móvil.
- El **logo de Dropi** del PRD no estaba disponible: `public/brand/isotipo.svg` es un marcador. Reemplázalo por el SVG de la presentación.
- Una cuenta con rol `datos`/`marcom` ve el tablero; el costo por lead solo se calcula si el rol puede leer `presupuestos`.
