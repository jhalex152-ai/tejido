'use client'
import { useEffect, useState } from 'react'

/** Cuenta regresiva de la ventana de 48 h para la primera publicación */
export function Countdown({ finISO, publicada }: { finISO: string; publicada: boolean }) {
  const [ahora, setAhora] = useState<number | null>(null)
  useEffect(() => {
    setAhora(Date.now())
    const t = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  if (ahora == null) return <p className="text-ink-muted">Calculando…</p>
  const restante = new Date(finISO).getTime() - ahora
  if (publicada) return <p className="font-semibold text-sem-green">✓ Ya hay una publicación registrada</p>
  if (restante <= 0) return <p className="font-semibold text-sem-amber">La ventana de 48 h venció sin publicación (hito en ámbar)</p>
  const h = Math.floor(restante / 3_600_000), m = Math.floor((restante % 3_600_000) / 60_000)
  return <p className="text-2xl font-bold tracking-tight text-brand-light">{h} h {m} min <span className="text-[14px] font-normal text-ink-muted">para la primera publicación</span></p>
}
