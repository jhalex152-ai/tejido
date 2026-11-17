'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function marcarLeidas(id?: string) {
  const sb = await createClient()
  const q = sb.from('notificaciones').update({ leida: true }).eq('leida', false)
  await (id ? q.eq('id', id) : q)
  revalidatePath('/notificaciones')
  revalidatePath('/inicio')
}
