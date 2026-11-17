import { NextResponse, type NextRequest } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'

// QR descargable del link con UTM. La lectura pasa por RLS: solo quien ve el plan de captura lo obtiene.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = await createClient()
  const { data } = await sb.from('canales_captura').select('codigo,url_final').eq('id', id).maybeSingle()
  if (!data) return new NextResponse('No encontrado', { status: 404 })
  const png = await QRCode.toBuffer(data.url_final, { width: 768, margin: 2, color: { dark: '#0D0D0D', light: '#FFFFFF' } })
  const descargar = request.nextUrl.searchParams.get('descargar') === '1'
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=300',
      ...(descargar ? { 'Content-Disposition': `attachment; filename="QR-${data.codigo}.png"` } : {}),
    },
  })
}
