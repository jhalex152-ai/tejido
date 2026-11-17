import type { Rol } from './types'

// Espejo de public.puede() solo para mostrar u ocultar controles.
// La seguridad real la aplica RLS en la base de datos.
type Modulo = 'ficha' | 'evaluacion' | 'datos' | 'narrativa' | 'evento' | 'costos_items' | 'presupuesto' | 'social' | 'medios' | 'captura' | 'resultados' | 'cierre'

const LECTURA: Record<Modulo, Rol[]> = {
  ficha: ['admin', 'lider_eventos', 'doer_eventos', 'lider_impacto', 'marcom', 'datos'],
  evaluacion: ['admin', 'lider_eventos', 'lider_impacto', 'marcom', 'datos'],
  datos: ['admin', 'lider_eventos', 'lider_impacto', 'marcom', 'datos'],
  narrativa: ['admin', 'lider_eventos', 'lider_impacto', 'marcom', 'datos'],
  evento: ['admin', 'lider_eventos', 'doer_eventos', 'lider_impacto', 'marcom'],
  costos_items: ['admin', 'lider_eventos', 'doer_eventos', 'lider_impacto', 'datos'],
  presupuesto: ['admin', 'lider_eventos', 'lider_impacto', 'datos'],
  social: ['admin', 'lider_eventos', 'lider_impacto', 'marcom', 'datos'],
  medios: ['admin', 'lider_eventos', 'lider_impacto', 'marcom', 'datos'],
  captura: ['admin', 'lider_eventos', 'doer_eventos', 'lider_impacto', 'marcom', 'datos'],
  resultados: ['admin', 'lider_eventos', 'lider_impacto', 'marcom', 'datos'],
  cierre: ['admin', 'lider_eventos', 'lider_impacto', 'marcom', 'datos'],
}
const ESCRITURA: Record<Modulo, Rol[]> = {
  ficha: ['admin', 'lider_eventos', 'lider_impacto', 'marcom'],
  evaluacion: ['admin', 'lider_eventos', 'lider_impacto'],
  datos: ['admin', 'datos'],
  narrativa: ['admin', 'marcom'],
  evento: ['admin', 'lider_eventos', 'doer_eventos', 'lider_impacto'],
  costos_items: ['admin', 'lider_eventos', 'doer_eventos', 'lider_impacto'],
  presupuesto: ['admin', 'lider_eventos', 'lider_impacto'],
  social: ['admin', 'lider_impacto'],
  medios: ['admin', 'marcom'],
  captura: ['admin', 'lider_eventos', 'lider_impacto'],
  resultados: ['admin', 'datos'],
  cierre: ['admin', 'datos'],
}

export const puedeLeer = (rol: Rol, m: Modulo) => LECTURA[m].includes(rol)
export const puedeEscribir = (rol: Rol, m: Modulo) => ESCRITURA[m].includes(rol)
export const esStaff = (rol: Rol) => rol !== 'consulta'
export const esAdmin = (rol: Rol) => rol === 'admin'
export const verAuditoria = (rol: Rol) => rol === 'admin' || rol === 'datos'
export const verTablero = (rol: Rol) => rol === 'admin' || rol === 'lider_eventos' || rol === 'lider_impacto' || rol === 'datos' || rol === 'marcom'

export const NAV_POR_ROL = (rol: Rol) =>
  rol === 'consulta'
    ? [{ href: '/consulta', label: 'Calendario', icon: 'calendar' }]
    : [
        { href: '/inicio', label: 'Inicio', icon: 'home' },
        { href: '/calendario', label: 'Calendario', icon: 'calendar' },
        { href: '/hitos', label: 'Hitos', icon: 'kanban' },
        { href: '/paises', label: 'Países', icon: 'globe' },
        ...(puedeLeer(rol, 'datos') ? [{ href: '/datos', label: 'Datos', icon: 'database' }] : []),
        ...(verTablero(rol) ? [{ href: '/tablero', label: 'Tablero', icon: 'chart' }] : []),
        ...(esAdmin(rol) ? [{ href: '/admin', label: 'Admin', icon: 'settings' }] : []),
      ]
