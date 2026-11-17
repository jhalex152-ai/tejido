import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tejido · PR, Ecosistema y Eventos',
  description: 'App interna del área de PR, Ecosistema y Eventos de Dropi',
  icons: { icon: '/brand/isotipo.png' },
}
export const viewport: Viewport = { themeColor: '#0D0D0D', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
