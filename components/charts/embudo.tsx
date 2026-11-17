'use client'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface FilaEmbudo { vertical: string; Capturados: number; Calificados: number; Registros: number; 'Activos a 30 d': number }

// Cuatro pasos del embudo en tonos de la marca, de más claro (arriba del embudo) a más intenso
const SERIES = [
  ['Capturados', '#FFD2A8'], ['Calificados', '#FF9D38'], ['Registros', '#FF6F20'], ['Activos a 30 d', '#C2410C'],
] as const

export function EmbudoChart({ data }: { data: FilaEmbudo[] }) {
  if (data.length === 0) return <p className="text-ink-muted">Aún no hay resultados cargados.</p>
  return (
    <div role="img" aria-label={`Embudo de leads por vertical: ${data.map((d) => `${d.vertical} ${d.Capturados} capturados, ${d.Calificados} calificados`).join('; ')}`} className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#262626" vertical={false} />
          <XAxis dataKey="vertical" stroke="#A3A3A3" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis stroke="#A3A3A3" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#141414', border: '1px solid #333', borderRadius: 12, color: '#F4F4F4' }} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#D4D4D4' }} />
          {SERIES.map(([k, c]) => <Bar key={k} dataKey={k} fill={c} radius={[4, 4, 0, 0]} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
