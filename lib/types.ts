export type Rol = 'admin' | 'lider_eventos' | 'doer_eventos' | 'lider_impacto' | 'marcom' | 'datos' | 'consulta'
export type Semaforo = 'verde' | 'ambar' | 'rojo'
export type EstadoHito = 'activo' | 'en_pausa' | 'descartado' | 'cerrado'
export type EstadoEtapa = 'pendiente' | 'abierta' | 'aprobada' | 'omitida'
export type TipoHito =
  | 'evento_externo' | 'evento_propio' | 'medios' | 'ranking_premio' | 'gremio_gobierno' | 'accion_social' | 'campana'

export interface Usuario { id: string; nombre: string; email: string; rol: Rol }

export interface Eje { id: number; slug: string; nombre: string; color: string; kpi: string }
export interface Pais {
  codigo: string; nombre: string; region: 'LATAM' | 'Europa'; marca: string; estado: string
  prioridad: 'alta' | 'media_alta' | 'media' | 'media_baja' | 'baja'; moneda: string; zona_horaria: string; contacto_local: string | null
}
export interface Etapa {
  id: number; nombre: string; orden: number; movilizador_id: number | null; rol_dueno: Rol
  roles_aprobadores: Rol[]; plazo_ref: 'inicio' | 'fin'; plazo_dias: number | null; descripcion: string | null
}
export interface Vertical { id: number; nombre: string; slug: string; codigo: string; responsable: string | null; reglas_calificacion: Record<string, string>; activa: boolean }

export interface HitoEtapa { etapa_id: number; estado: EstadoEtapa; vence_en: string | null; abierta_en?: string | null; aprobada_en?: string | null; forzada?: boolean; motivo?: string | null; comentario?: string | null }

export interface Hito {
  id: string; nombre: string; slug: string; tipo: TipoHito; eje_id: number; ejes_secundarios: number[]
  fecha_inicio: string; fecha_fin: string; hora_inicio: string | null; ciudad: string | null; venue: string | null
  organizador: string | null; url: string | null; asistentes_estimados: number | null; asistentes_reales: number | null
  moneda: string; etapa_id: number; estado: EstadoHito; motivo_estado: string | null; semaforo: Semaforo
  responsable_id: string | null; puntaje_evaluacion: number | null; fecha_por_confirmar: boolean
  hito_paises?: { pais_codigo: string; principal: boolean }[]
  hito_etapas?: HitoEtapa[]
}

export interface HitoVertical {
  hito_id: string; vertical_id: number; pertinencia: number; importancia: number
  rol: 'protagonista' | 'presente' | 'no_va'; rol_confirmado: boolean
  audiencia_objetivo: number | null; meta_leads: number | null; participacion_costo: number | null
}
export interface ResultadoLeads {
  hito_id: string; vertical_id: number; capturados: number; calif_a: number; calif_b: number; calif_c: number
  existentes: number; registros: number; activados_30d: number; fuente: string
}
export interface Calendario {
  id: string; nombre: string; tipo: TipoHito; fecha_inicio: string; fecha_fin: string; fecha_por_confirmar: boolean
  pais_codigo: string | null; paises: string[]; ciudad: string | null; venue: string | null
  eje_id: number; eje: string; eje_color: string; estado: EstadoHito; verticales: string[]
}
export type Resultado<T = unknown> = { ok: true; data?: T; mensaje?: string } | { ok: false; error: string; faltantes?: string[] }
