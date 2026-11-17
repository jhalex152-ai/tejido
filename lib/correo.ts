import 'server-only'

/** Envía un correo con Resend. Sin RESEND_API_KEY no hace nada (devuelve false). */
export async function enviarCorreo(para: string, asunto: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.RESEND_FROM ?? 'Tejido <onboarding@resend.dev>', to: [para], subject: asunto, html }),
  })
  return r.ok
}

export const plantillaCorreo = (titulo: string, detalle: string | null, link: string) => `
<div style="font-family:Inter,Arial,sans-serif;background:#0D0D0D;color:#F4F4F4;padding:24px;border-radius:16px;max-width:520px">
  <p style="color:#FF9D38;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin:0 0 8px">Tejido · Dropi</p>
  <h2 style="margin:0 0 8px;font-size:20px">${titulo.replace(/</g, '&lt;')}</h2>
  ${detalle ? `<p style="color:#D4D4D4;margin:0 0 16px">${detalle.replace(/</g, '&lt;')}</p>` : ''}
  <a href="${link}" style="display:inline-block;background:linear-gradient(90deg,#FF6F20,#FF9D38);color:#0D0D0D;font-weight:600;padding:12px 20px;border-radius:999px;text-decoration:none">Abrir en Tejido</a>
</div>`
