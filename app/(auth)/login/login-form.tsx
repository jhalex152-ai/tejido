'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const redirectTo = () => `${window.location.origin}/auth/callback`

  async function google() {
    const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } })
    if (error) { setEstado('error'); setMsg('No pudimos abrir Google. Inténtalo de nuevo.') }
  }

  async function enlace(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo() },
    })
    if (error) {
      setEstado('error')
      setMsg('No pudimos enviar el enlace. Verifica que tu correo esté invitado.')
    } else {
      setEstado('enviado')
      setMsg('Revisa tu correo: te enviamos un enlace para entrar.')
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <button type="button" onClick={google} className="btn-primary w-full">Continuar con Google</button>
      <div className="flex items-center gap-3 text-[12px] text-ink-faint"><span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" /></div>
      <form onSubmit={enlace} className="space-y-3">
        <label className="label" htmlFor="email">Correo</label>
        <input id="email" type="email" required autoComplete="email" className="field" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="nombre@dropi.co" />
        <button className="btn-outline w-full" disabled={estado === 'enviando'}>
          {estado === 'enviando' ? 'Enviando…' : 'Enviarme un enlace mágico'}
        </button>
      </form>
      {msg && <p role="status" className={estado === 'error' ? 'text-[14px] text-sem-red' : 'text-[14px] text-sem-green'}>{msg}</p>}
    </div>
  )
}
