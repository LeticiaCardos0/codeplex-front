import { useCallback, useState } from 'react'
import { ApiError, bilheteria } from '../api'
import { Erro, StatusPedido } from '../components'
import { link } from '../rotas'
import type { Ingresso } from '../types'
import { formatarDataHora, formatarDataLonga, formatarMoeda, mascararCpf, usePolling } from '../util'

export default function PedidoPage({ id }: { id: number }) {
  const [ingresso, setIngresso] = useState<Ingresso | null>(null)
  const [erro, setErro] = useState<unknown>(null)
  const [segundos, setSegundos] = useState(0)

  const carregar = useCallback(async () => {
    try {
      setIngresso(await bilheteria.obterIngresso(id))
      setErro(null)
    } catch (e) {
      setErro(e)
    }
    setSegundos((s) => s + 1.5)
  }, [id])

  const pendente = !ingresso || ingresso.status === 'PENDENTE'
  usePolling(carregar, 1500, pendente)

  if (erro instanceof ApiError && erro.status === 404) {
    return (
      <div className="container estado estado--pagina">
        <p className="estado__titulo">Pedido não encontrado.</p>
        <a className="botao botao--secundario" href={link.meus}>Ver meus ingressos</a>
      </div>
    )
  }

  if (!ingresso) {
    return (
      <div className="container pedido">
        <div className="card-esqueleto pedido__esqueleto" />
        <Erro erro={erro} cliente />
      </div>
    )
  }

  const total = Number(ingresso.evento.preco) * ingresso.quantidade

  return (
    <div className="container pedido">
      <a className="voltar" href={link.evento(ingresso.evento.id)}>← {ingresso.evento.nome}</a>

      {ingresso.status === 'PENDENTE' && (
        <section className="pedido__estado" aria-live="polite">
          <span className="girando" aria-hidden />
          <div>
            <h1 className="pedido__titulo">Confirmando seu pagamento</h1>
            <p>
              Seus {ingresso.quantidade} {ingresso.quantidade === 1 ? 'lugar está reservado' : 'lugares estão reservados'}.
              Isso costuma levar poucos segundos — pode deixar esta página aberta.
            </p>
            {segundos > 30 && (
              <p className="pedido__demora">
                Está demorando mais que o normal. Assim que o pagamento for confirmado, o ingresso aparece em{' '}
                <a href={link.meus}>Meus ingressos</a>.
              </p>
            )}
          </div>
        </section>
      )}

      {ingresso.status === 'PAGO' && (
        <section className="pedido__estado pedido__estado--ok" aria-live="polite">
          <span className="icone-ok" aria-hidden>✓</span>
          <div>
            <h1 className="pedido__titulo">Pagamento aprovado. Seu ingresso está garantido.</h1>
            <p>Apresente o código abaixo na entrada do evento junto com um documento com foto.</p>
          </div>
        </section>
      )}

      {ingresso.status === 'CANCELADO' && (
        <section className="pedido__estado pedido__estado--erro" aria-live="polite">
          <span className="icone-erro" aria-hidden>!</span>
          <div>
            <h1 className="pedido__titulo">Pagamento recusado</h1>
            <p>O cartão não foi aprovado e nada foi cobrado. Os lugares voltaram a ficar disponíveis.</p>
            <a className="botao botao--primario" href={link.evento(ingresso.evento.id)}>Tentar com outro cartão</a>
          </div>
        </section>
      )}

      <Bilhete ingresso={ingresso} total={total} />
    </div>
  )
}

function Bilhete({ ingresso, total }: { ingresso: Ingresso; total: number }) {
  const pago = ingresso.status === 'PAGO'
  return (
    <article className={`bilhete ${pago ? '' : 'bilhete--inativo'}`} aria-label="Ingresso">
      <div className="bilhete__principal">
        <p className="sobretitulo">Plateia · Ingresso</p>
        <h2 className="bilhete__evento">{ingresso.evento.nome}</h2>
        <p className="bilhete__data primeira-maiuscula">{formatarDataLonga(ingresso.evento.data)}</p>
        <dl className="bilhete__dados">
          <div><dt>Titular (CPF)</dt><dd>{mascararCpf(ingresso.cpf)}</dd></div>
          <div><dt>Quantidade</dt><dd>{ingresso.quantidade}</dd></div>
          <div><dt>Total</dt><dd>{formatarMoeda(total)}</dd></div>
          <div><dt>Pedido</dt><dd>#{ingresso.id}</dd></div>
        </dl>
      </div>
      <div className="bilhete__canhoto">
        {pago ? <Codigo semente={`${ingresso.id}-${ingresso.cobranca_id}`} /> : <div className="bilhete__codigo-vazio" />}
        <StatusPedido valor={ingresso.status} />
        <small>Comprado em {formatarDataHora(ingresso.criado_em)}</small>
      </div>
    </article>
  )
}

/** Padrão visual estilo QR, determinístico por pedido (decorativo). */
function Codigo({ semente }: { semente: string }) {
  let h = 2166136261
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const n = 21
  const celulas: [number, number][] = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const canto = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
      if (canto) continue
      h = Math.imul(h ^ (x * 31 + y), 2654435761)
      if ((h >>> 28) & 1) celulas.push([x, y])
    }
  }
  const marcador = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="var(--papel)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} />
    </g>
  )
  return (
    <svg className="bilhete__codigo" viewBox={`-1 -1 ${n + 2} ${n + 2}`} role="img" aria-label="Código do ingresso">
      {celulas.map(([x, y]) => <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} />)}
      {marcador(0, 0)}
      {marcador(n - 7, 0)}
      {marcador(0, n - 7)}
    </svg>
  )
}
