'use client'
import { ActionForm } from '@/components/forms/action-form'
import { avanzar } from '../actions'

export function AprobarCompuerta({ id, etapa, puedeAprobar, esAdmin, hayFaltantes }: { id: string; etapa: string; puedeAprobar: boolean; esAdmin: boolean; hayFaltantes: boolean }) {
  if (!puedeAprobar && !esAdmin) return null
  return (
    <div className="space-y-3">
      {puedeAprobar && (
        <ActionForm action={(fd) => avanzar(id, fd)} submit={`Aprobar compuerta de ${etapa}`}>
          <div>
            <label className="label" htmlFor="comentario">Comentario (opcional)</label>
            <input id="comentario" name="comentario" className="field" placeholder="Ej: cifra validada con Datos" />
          </div>
        </ActionForm>
      )}
      {esAdmin && (
        <details className="rounded-field border border-line-strong p-3">
          <summary className="cursor-pointer text-[13px] text-ink-muted">Forzar avance (solo administrador, queda en el log)</summary>
          <ActionForm action={(fd) => avanzar(id, fd)} submit="Forzar avance" outline className="mt-3">
            <input type="hidden" name="forzar" value="on" />
            <label className="label" htmlFor="motivo-forzar">Motivo (obligatorio)</label>
            <input id="motivo-forzar" name="motivo" required className="field" placeholder={hayFaltantes ? 'Por qué se salta lo que falta' : 'Motivo'} />
          </ActionForm>
        </details>
      )}
    </div>
  )
}
