'use client'
import { ActionForm } from '@/components/forms/action-form'
import { cambiarEstado, duplicarHito, eliminarHito } from '../actions'

export function CambiarEstado({ id, estado, puedeCambiar, esAdmin }: { id: string; estado: string; puedeCambiar: boolean; esAdmin: boolean }) {
  return (
    <div className="space-y-4">
      {puedeCambiar && estado !== 'cerrado' && (
        <ActionForm action={(fd) => cambiarEstado(id, fd)} submit="Cambiar estado" outline>
          <div className="grid gap-3 md:grid-cols-[200px_1fr]">
            <div><label className="label" htmlFor="estado">Estado</label>
              <select id="estado" name="estado" className="field" defaultValue={estado}>
                <option value="activo">Activo</option><option value="en_pausa">En pausa</option><option value="descartado">Descartado</option>
              </select></div>
            <div><label className="label" htmlFor="motivo-estado">Motivo (obligatorio al pausar o descartar)</label>
              <input id="motivo-estado" name="motivo" className="field" /></div>
          </div>
        </ActionForm>
      )}
      {puedeCambiar && (
        <details className="rounded-field border border-line-strong p-3">
          <summary className="cursor-pointer text-[13px] text-ink-muted">Duplicar para otra edición (conserva ficha, países y matriz de verticales)</summary>
          <ActionForm action={(fd) => duplicarHito(id, fd)} submit="Duplicar hito" outline className="mt-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label" htmlFor="d-ini">Nuevo inicio</label><input id="d-ini" type="date" name="fecha_inicio" required className="field" /></div>
              <div><label className="label" htmlFor="d-fin">Nuevo fin</label><input id="d-fin" type="date" name="fecha_fin" className="field" /></div>
            </div>
          </ActionForm>
        </details>
      )}
      {esAdmin && (
        <details className="rounded-field border border-sem-red/30 p-3">
          <summary className="cursor-pointer text-[13px] text-sem-red">Borrar hito (solo administrador, queda en el log)</summary>
          <ActionForm action={(fd) => eliminarHito(id, fd)} submit="Borrar definitivamente" className="mt-3">
            <label className="label" htmlFor="motivo-borrar">Motivo (obligatorio)</label>
            <input id="motivo-borrar" name="motivo" required className="field" />
          </ActionForm>
        </details>
      )}
    </div>
  )
}
