import type { ReactNode } from 'react'
import { ApiError } from './api'
import type { StatusIngresso } from './types'

const CORES: Record<string, string> = {
  PENDENTE: 'pendente',
  PAGO: 'ok',
  APROVADA: 'ok',
  CANCELADO: 'erro',
  RECUSADA: 'erro',
}

/** Status técnico (painel do produtor). */
export function Status({ valor }: { valor: string }) {
  return (
    <span className={`status status--${CORES[valor] ?? 'neutro'}`}>
      {valor === 'PENDENTE' && <span className="status__pulso" aria-hidden />}
      {valor}
    </span>
  )
}

const ROTULO_CLIENTE: Record<StatusIngresso, string> = {
  PENDENTE: 'Aguardando pagamento',
  PAGO: 'Confirmado',
  CANCELADO: 'Cancelado',
}

/** Status em linguagem de cliente (loja). */
export function StatusPedido({ valor }: { valor: StatusIngresso }) {
  return (
    <span className={`status status--${CORES[valor] ?? 'neutro'}`}>
      {valor === 'PENDENTE' && <span className="status__pulso" aria-hidden />}
      {ROTULO_CLIENTE[valor] ?? valor}
    </span>
  )
}

/** Mensagem amigável para erros de API na loja. */
export function mensagemCliente(erro: unknown) {
  if (!(erro instanceof ApiError)) return 'Algo deu errado. Tente novamente.'
  if (erro.offline || erro.codigo === 'servico_indisponivel') {
    return 'O pagamento está fora do ar agora. Nenhum valor foi cobrado — tente de novo em instantes.'
  }
  if (erro.status === 400 && erro.detalhes.length) {
    return erro.detalhes.map((d) => d.mensagem).join(' · ')
  }
  return erro.message
}

export function Erro({ erro, cliente = false }: { erro: unknown; cliente?: boolean }) {
  if (!erro) return null
  const e = erro instanceof ApiError ? erro : null
  if (cliente) {
    return (
      <div className="alerta alerta--erro" role="alert">
        <span>{mensagemCliente(erro)}</span>
      </div>
    )
  }
  return (
    <div className="alerta alerta--erro" role="alert">
      <strong>{e ? `${e.status || ''} ${e.codigo}`.trim() : 'erro'}</strong>
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
  erro,
  children,
}: {
  rotulo: string
  dica?: ReactNode
  erro?: string | null
  children: ReactNode
}) {
  return (
    <label className={`campo ${erro ? 'campo--invalido' : ''}`}>
      <span className="campo__rotulo">{rotulo}</span>
      {children}
      {erro ? <span className="campo__erro">{erro}</span> : dica && <span className="campo__dica">{dica}</span>}
    </label>
  )
}

/** Selo de data no estilo de bilhete: "20 / dez". */
export function SeloData({ iso, claro = false }: { iso: string; claro?: boolean }) {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  return (
    <span className={`selo ${claro ? 'selo--claro' : ''}`} aria-hidden>
      <span className="selo__dia">{String(d.getDate()).padStart(2, '0')}</span>
      <span className="selo__mes">{d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
    </span>
  )
}

/** Imagem com fundo de reserva caso o serviço de imagens falhe. */
export function Imagem({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <span className={`imagem ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </span>
  )
}
