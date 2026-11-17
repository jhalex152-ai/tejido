import type { Rol, TipoHito } from './types'

export const ROL_LABEL: Record<Rol, string> = {
  admin: 'Administrador',
  lider_eventos: 'Líder de eventos',
  doer_eventos: 'Doer de eventos',
  lider_impacto: 'Líder de impacto',
  marcom: 'Marketing y comunicaciones',
  datos: 'Datos',
  consulta: 'Consulta',
}

export const TIPO_LABEL: Record<TipoHito, string> = {
  evento_externo: 'Evento externo',
  evento_propio: 'Evento propio',
  medios: 'Aparición en medios',
  ranking_premio: 'Ranking o premio',
  gremio_gobierno: 'Gremio o mesa de gobierno',
  accion_social: 'Acción social',
  campana: 'Campaña',
}
export const TIPOS_EVENTO: TipoHito[] = ['evento_externo', 'evento_propio']

export const PRIORIDAD_LABEL = {
  alta: 'Alta', media_alta: 'Media-alta', media: 'Media', media_baja: 'Media-baja', baja: 'Baja',
} as const

export const MOVILIZADORES = [
  { id: 1, nombre: 'Datos', icono: 'database', etapas: [2] },
  { id: 2, nombre: 'Narrativa', icono: 'message-circle', etapas: [3] },
  { id: 3, nombre: 'Eventos', icono: 'users', etapas: [4, 5] },
  { id: 4, nombre: 'Medios', icono: 'send', etapas: [6] },
] as const

export const NOMBRE_ETAPA: Record<number, string> = {
  0: 'Radar', 1: 'Evaluación', 2: 'Datos', 3: 'Narrativa', 4: 'Preparación', 5: 'Ejecución', 6: 'Amplificación', 7: 'Cierre',
}

export const MONEDAS_ORDEN = ['COP', 'USD', 'EUR', 'MXN']
