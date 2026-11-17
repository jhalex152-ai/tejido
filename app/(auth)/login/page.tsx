import { LoginForm } from './login-form'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-deep px-4">
      <div className="card-raised w-full max-w-md p-8">
        <p className="eyebrow">Dropi · PR, Ecosistema y Eventos</p>
        <h1 className="mt-1 text-3xl">Tejido</h1>
        <p className="mt-2 text-ink-muted">Datos → Narrativa → Eventos → Medios, en ese orden. Entra con el correo con el que te invitaron.</p>
        {error && (
          <p role="alert" className="mt-4 rounded-box border border-sem-red/40 bg-sem-red/10 p-3 text-[14px] text-sem-red">
            {error === 'sin_acceso'
              ? 'Tu correo no está invitado o tu usuario está inactivo. Pide al administrador que te invite.'
              : 'No pudimos iniciar tu sesión. Inténtalo de nuevo con el correo invitado.'}
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  )
}
