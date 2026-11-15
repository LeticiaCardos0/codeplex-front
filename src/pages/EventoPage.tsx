import { useCallback, useState, type FormEvent } from 'react'
import { ApiError, bilheteria } from '../api'
import { Campo, Erro, Imagem, SeloData } from '../components'
import { irPara, link } from '../rotas'
import type { Evento } from '../types'
import {
  cpfSalvo,
  formatarDataLonga,
  formatarMoeda,
  imagemEvento,
  mascaraCpf,
  salvarCpf,
  somenteDigitos,
  usePolling,
} from '../util'

const MAX_POR_COMPRA = 10

export default function EventoPage({ id }: { id: number }) {
  const [evento, setEvento] = useState<Evento | null>(null)
  const [erro, setErro] = useState<unknown>(null)

  const carregar = useCallback(async () => {
    try {
      setEvento(await bilheteria.obterEvento(id))
      setErro(null)
    } catch (e) {
      setErro(e)
    }
  }, [id])
  usePolling(carregar, 8000)

  if (erro instanceof ApiError && erro.status === 404) {
    return (
      <div className="container estado estado--pagina">
        <p className="estado__titulo">Este evento não existe ou saiu de cartaz.</p>
        <a className="botao botao--secundario" href={link.home}>Ver todos os eventos</a>
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="container pagina-evento">
        <div className="pagina-evento__banner card-esqueleto" />
        {erro ? <Erro erro={erro} cliente /> : null}
      </div>
    )
  }

  const esgotado = evento.vagas === 0

  return (
    <article className="pagina-evento">
      <div className="container">
        <a className="voltar" href={link.home}>← Todos os eventos</a>
      </div>

      <header className="pagina-evento__banner container">
        <Imagem src={imagemEvento(evento.id, 1600, 900)} alt={`Imagem ilustrativa de ${evento.nome}`} />
      </header>

      <div className="pagina-evento__corpo container">
        <div className="pagina-evento__info">
          <div className="pagina-evento__cabecalho">
            <SeloData iso={evento.data} />
            <div>
              <h1 className="pagina-evento__titulo">{evento.nome}</h1>
              <p className="pagina-evento__data primeira-maiuscula">{formatarDataLonga(evento.data)}</p>
            </div>
          </div>

          <dl className="ficha">
            <div>
              <dt>Ingresso</dt>
              <dd>{formatarMoeda(evento.preco)}</dd>
            </div>
            <div>
              <dt>Disponíveis</dt>
              <dd>{esgotado ? 'Esgotado' : `${evento.vagas} ${evento.vagas === 1 ? 'lugar' : 'lugares'}`}</dd>
            </div>
            <div>
              <dt>Limite por compra</dt>
              <dd>{MAX_POR_COMPRA} ingressos</dd>
            </div>
          </dl>

          <section className="texto-evento">
            <h2>Sobre a compra</h2>
            <p>
              Ao finalizar, seus lugares ficam reservados enquanto o pagamento é confirmado, o que costuma levar
              poucos segundos. Se o cartão for recusado, a reserva é desfeita e nada é cobrado.
            </p>
            <p>O ingresso fica disponível em Meus ingressos, vinculado ao CPF informado na compra.</p>
          </section>
        </div>

        <aside className="compra" aria-label="Comprar ingressos">
          {esgotado ? (
            <div className="compra__esgotado">
              <p className="compra__esgotado-titulo">Ingressos esgotados</p>
              <p>Todos os lugares deste evento foram vendidos.</p>
              <a className="botao botao--secundario" href={link.home}>Ver outros eventos</a>
            </div>
          ) : (
            <Checkout evento={evento} />
          )}
        </aside>
      </div>
    </article>
  )
}

function Checkout({ evento }: { evento: Evento }) {
  const max = Math.min(evento.vagas, MAX_POR_COMPRA)
  const [quantidade, setQuantidade] = useState(Math.min(2, max))
  const [cpf, setCpf] = useState(() => mascaraCpf(cpfSalvo()))
  const [cartao, setCartao] = useState('')
  const [tocado, setTocado] = useState(false)
  const [erro, setErro] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  const qtd = Math.min(quantidade, max)
  const total = Number(evento.preco) * qtd
  const cpfLimpo = somenteDigitos(cpf)
  const erroCpf = cpfLimpo.length === 11 ? null : 'Informe os 11 dígitos do CPF'
  const erroCartao = /^\d{4}$/.test(cartao) ? null : 'Informe os 4 últimos dígitos'

  async function finalizar(e: FormEvent) {
    e.preventDefault()
    setTocado(true)
    if (erroCpf || erroCartao) return
    setEnviando(true)
    setErro(null)
    try {
      const ingresso = await bilheteria.comprar(evento.id, { cpf: cpfLimpo, quantidade: qtd, cartao_final: cartao })
      salvarCpf(cpfLimpo)
      irPara(link.pedido(ingresso.id))
    } catch (err) {
      setErro(err)
      setEnviando(false)
    }
  }

  return (
    <form className="compra__form" onSubmit={finalizar} noValidate>
      <div className="compra__linha">
        <div>
          <p className="compra__rotulo">Inteira</p>
          <p className="compra__preco">{formatarMoeda(evento.preco)}</p>
        </div>
        <div className="contador" role="group" aria-label="Quantidade de ingressos">
          <button type="button" onClick={() => setQuantidade(qtd - 1)} disabled={qtd <= 1} aria-label="Menos um">−</button>
          <output aria-live="polite">{qtd}</output>
          <button type="button" onClick={() => setQuantidade(qtd + 1)} disabled={qtd >= max} aria-label="Mais um">+</button>
        </div>
      </div>

      <div className="compra__dados">
        <Campo rotulo="CPF do titular" erro={tocado ? erroCpf : null}>
          <input
            value={cpf}
            onChange={(e) => setCpf(mascaraCpf(e.target.value))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
          />
        </Campo>
        <Campo
          rotulo="Cartão de crédito"
          erro={tocado ? erroCartao : null}
          dica="Só os 4 últimos dígitos do cartão"
        >
          <div className="campo-cartao">
            <span aria-hidden>•••• •••• ••••</span>
            <input
              value={cartao}
              onChange={(e) => setCartao(somenteDigitos(e.target.value).slice(0, 4))}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0000"
              aria-label="Últimos 4 dígitos do cartão"
            />
          </div>
        </Campo>
      </div>

      <div className="compra__total">
        <span>Total ({qtd} {qtd === 1 ? 'ingresso' : 'ingressos'})</span>
        <strong>{formatarMoeda(total)}</strong>
      </div>

      <Erro erro={erro} cliente />

      <button className="botao botao--primario botao--grande botao--bloco" disabled={enviando}>
        {enviando ? 'Processando…' : `Pagar ${formatarMoeda(total)}`}
      </button>

      <p className="compra__demo">
        Ambiente de demonstração: cartão final <button type="button" onClick={() => setCartao('4242')}>4242</button>{' '}
        aprova, <button type="button" onClick={() => setCartao('0000')}>0000</button> recusa.
      </p>
    </form>
  )
}
