'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Resultado } from '@/lib/types'

/** Sube a Storage (bucket privado "archivos") y registra la ruta con una Server Action. */
export function SubirArchivo({
  hitoId, carpeta, etiqueta, accept = 'image/*,application/pdf', registrar,
}: { hitoId: string; carpeta: string; etiqueta: string; accept?: string; registrar: (path: string) => Promise<Resultado> }) {
  const [estado, setEstado] = useState<string>('')
  async function subir(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 20 * 1024 * 1024) return setEstado('El archivo supera los 20 MB')
    setEstado('Subiendo…')
    const limpio = f.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '_')
    const path = `${hitoId}/${carpeta}/${Date.now()}-${limpio}`
    const { error } = await createClient().storage.from('archivos').upload(path, f, { upsert: false })
    if (error) return setEstado('No se pudo subir: ' + error.message)
    const r = await registrar(path)
    setEstado(r.ok ? '✓ Archivo cargado' : r.error)
    e.target.value = ''
  }
  return (
    <div>
      <label className="label" htmlFor={`up-${carpeta}`}>{etiqueta}</label>
      <input id={`up-${carpeta}`} type="file" accept={accept} onChange={subir}
        className="block w-full text-[13px] text-ink-muted file:mr-3 file:min-h-[44px] file:rounded-full file:border file:border-line-strong file:bg-surface-muted file:px-4 file:text-ink-soft hover:file:border-brand" />
      {estado && <p role="status" className="mt-1 text-[12px] text-ink-muted">{estado}</p>}
    </div>
  )
}
