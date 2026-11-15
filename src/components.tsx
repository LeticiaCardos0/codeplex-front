import type { ReactNode } from 'react'
import { ApiError } from './api'

const CORES: Record<string, string> = {
  PENDENTE: 'pendente',
  PAGO: 'ok',
  APROVADA: 'ok',
  CANCELADO: 'erro',
  RECUSADA: 'erro',
}

export function Status({ valor }: { valor: string }) {
  return (
    <span className={`status status--${CORES[valor] ?? 'neutro'}`}>
      {valor === 'PENDENTE' && <span className="status__pulso" aria-hidden />}
      {valor}
    </span>
  )
}

export function Erro({ erro }: { erro: unknown }) {
  if (!erro) return null
  const e = erro instanceof ApiError ? erro : null
  return (
    <div className="alerta alerta--erro" role="alert">
      <strong>
        {e ? `${e.status || ''} ${e.codigo}`.trim() : 'erro'}
      </strong>
      <span>{e ? e.message : String(erro)}</span>
      {e && e.detalhes.length > 0 && (
        <ul>
          {e.detalhes.map((d, i) => (
            <li key={i}>
              {d.campo && <code>{d.campo}</code>} {d.mensagem}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Painel({
  titulo,
  acao,
  children,
  className = '',
}: {
  titulo: ReactNode
  acao?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`painel ${className}`}>
      <header className="painel__topo">
        <h2>{titulo}</h2>
        {acao}
      </header>
      {children}
    </section>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="vazio">{children}</p>
}

export function Campo({
  rotulo,
  dica,
  children,
}: {
  rotulo: string
  dica?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="campo">
      <span className="campo__rotulo">{rotulo}</span>
      {children}
      {dica && <span className="campo__dica">{dica}</span>}
    </label>
  )
}
