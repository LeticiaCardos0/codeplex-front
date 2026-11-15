import { useCallback, useState, type FormEvent } from 'react'
import { bilheteria } from '../api'
import { Campo, Erro, Painel, Status, Vazio } from '../components'
import type { Evento, Ingresso } from '../types'
import { amanha, formatarData, formatarDataHora, formatarMoeda, mascararCpf, usePolling } from '../util'

export default function Bilheteria() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [ingressos, setIngressos] = useState<Ingresso[]>([])
  const [erroLista, setErroLista] = useState<unknown>(null)
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null)
  const [criando, setCriando] = useState(false)

  const recarregar = useCallback(async () => {
    try {
      const [ev, ing] = await Promise.all([bilheteria.listarEventos(), bilheteria.listarIngressos()])
      setEventos([...ev].sort((a, b) => b.id - a.id))
      setIngressos(ing)
      setErroLista(null)
    } catch (e) {
      setErroLista(e)
    }
  }, [])

  // Enquanto houver ingresso PENDENTE, atualiza rápido para ver o webhook chegar.
  const temPendente = ingressos.some((i) => i.status === 'PENDENTE')
  usePolling(recarregar, temPendente ? 1500 : 5000)

  const selecionado = eventos.find((e) => e.id === selecionadoId) ?? null

  return (
    <div className="grade">
      <div className="coluna">
        <Painel
          titulo="Eventos"
          acao={
            <button className="botao botao--fantasma" onClick={() => setCriando((c) => !c)}>
              {criando ? 'Fechar' : '+ Novo evento'}
            </button>
          }
        >
          {criando && (
            <NovoEvento
              onCriado={(ev) => {
                setCriando(false)
                setSelecionadoId(ev.id)
                recarregar()
              }}
            />
          )}
          <Erro erro={erroLista} />
          {eventos.length === 0 && !erroLista ? (
            <Vazio>Nenhum evento ainda. Crie o primeiro em “+ Novo evento”.</Vazio>
          ) : (
            <ul className="lista-eventos">
              {eventos.map((ev) => (
                <li key={ev.id}>
                  <button
                    className={`evento ${ev.id === selecionadoId ? 'evento--ativo' : ''}`}
                    onClick={() => setSelecionadoId(ev.id)}
                  >
                    <span className="evento__nome">
                      <span className="id">#{ev.id}</span> {ev.nome}
                    </span>
                    <span className="evento__meta">
                      {formatarData(ev.data)} · {formatarMoeda(ev.preco)}
                    </span>
                    <span className={`evento__vagas ${ev.vagas === 0 ? 'esgotado' : ''}`}>
                      {ev.vagas === 0 ? 'Esgotado' : `${ev.vagas} vagas`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      <div className="coluna">
        <Painel titulo={selecionado ? `Comprar · ${selecionado.nome}` : 'Comprar ingresso'}>
          {selecionado ? (
            <Compra key={selecionado.id} evento={selecionado} ingressos={ingressos} onComprou={recarregar} />
          ) : (
            <Vazio>Escolha um evento na lista para comprar.</Vazio>
          )}
        </Painel>

        <Painel titulo="Ingressos" acao={temPendente && <span className="ao-vivo">aguardando webhook…</span>}>
          {ingressos.length === 0 ? (
            <Vazio>Nenhum ingresso vendido.</Vazio>
          ) : (
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Evento</th>
                    <th>CPF</th>
                    <th className="num">Qtd</th>
                    <th className="num">Cobrança</th>
                    <th>Status</th>
                    <th>Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {ingressos.map((i) => (
                    <tr key={i.id}>
                      <td className="id">{i.id}</td>
                      <td>{i.evento?.nome}</td>
                      <td className="mono">{mascararCpf(i.cpf)}</td>
                      <td className="num">{i.quantidade}</td>
                      <td className="num mono">#{i.cobranca_id}</td>
                      <td><Status valor={i.status} /></td>
                      <td className="suave">{formatarDataHora(i.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Painel>
      </div>
    </div>
  )
}

function NovoEvento({ onCriado }: { onCriado: (ev: Evento) => void }) {
  const [nome, setNome] = useState('')
  const [data, setData] = useState(amanha())
  const [preco, setPreco] = useState('150.00')
  const [vagas, setVagas] = useState('10')
  const [erro, setErro] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      const ev = await bilheteria.criarEvento({ nome, data, preco: Number(preco), vagas: Number(vagas) })
      onCriado(ev)
    } catch (err) {
      setErro(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario formulario--destaque" onSubmit={enviar}>
      <Campo rotulo="Nome">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Show da Turma" maxLength={150} />
      </Campo>
      <div className="linha">
        <Campo rotulo="Data">
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <Campo rotulo="Preço (R$)">
          <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </Campo>
        <Campo rotulo="Vagas">
          <input type="number" value={vagas} onChange={(e) => setVagas(e.target.value)} />
        </Campo>
      </div>
      <Erro erro={erro} />
      <button className="botao botao--bilheteria" disabled={enviando}>
        {enviando ? 'Criando…' : 'Criar evento'}
      </button>
    </form>
  )
}

function Compra({
  evento,
  ingressos,
  onComprou,
}: {
  evento: Evento
  ingressos: Ingresso[]
  onComprou: () => void
}) {
  const [cpf, setCpf] = useState('12345678901')
  const [quantidade, setQuantidade] = useState('2')
  const [cartao, setCartao] = useState('4242')
  const [erro, setErro] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)
  const [ultimoId, setUltimoId] = useState<number | null>(null)

  const qtd = Number(quantidade) || 0
  const total = Number(evento.preco) * qtd
  // O ingresso acompanhado vem da lista, que é atualizada pelo polling.
  const ultimo = ingressos.find((i) => i.id === ultimoId) ?? null

  async function comprar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      const ingresso = await bilheteria.comprar(evento.id, {
        cpf: cpf.replace(/\D/g, ''),
        quantidade: qtd,
        cartao_final: cartao,
      })
      setUltimoId(ingresso.id)
      onComprou()
    } catch (err) {
      setErro(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <dl className="resumo">
        <div><dt>Data</dt><dd>{formatarData(evento.data)}</dd></div>
        <div><dt>Preço</dt><dd>{formatarMoeda(evento.preco)}</dd></div>
        <div><dt>Vagas</dt><dd>{evento.vagas}</dd></div>
      </dl>

      <form className="formulario" onSubmit={comprar}>
        <Campo rotulo="CPF" dica="11 dígitos, só números">
          <input value={cpf} onChange={(e) => setCpf(e.target.value)} inputMode="numeric" maxLength={14} />
        </Campo>
        <div className="linha">
          <Campo rotulo="Quantidade">
            <input type="number" min={1} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
          </Campo>
          <Campo
            rotulo="Final do cartão"
            dica={
              <>
                <button type="button" className="chip" onClick={() => setCartao('4242')}>4242 aprova</button>
                <button type="button" className="chip" onClick={() => setCartao('0000')}>0000 recusa</button>
              </>
            }
          >
            <input value={cartao} onChange={(e) => setCartao(e.target.value)} inputMode="numeric" maxLength={4} />
          </Campo>
        </div>
        <div className="total">
          <span>Total cobrado em Pagamentos</span>
          <strong>{formatarMoeda(total)}</strong>
        </div>
        <Erro erro={erro} />
        <button className="botao botao--bilheteria" disabled={enviando}>
          {enviando ? 'Enviando cobrança…' : 'Comprar'}
        </button>
      </form>

      {ultimo && (
        <div className={`acompanhamento acompanhamento--${ultimo.status.toLowerCase()}`}>
          <div className="acompanhamento__topo">
            <span>Ingresso <strong>#{ultimo.id}</strong> · cobrança #{ultimo.cobranca_id}</span>
            <Status valor={ultimo.status} />
          </div>
          <ol className="linha-tempo">
            <li className="feito">Compra recebida, vagas reservadas</li>
            <li className="feito">Cobrança #{ultimo.cobranca_id} criada em Pagamentos</li>
            <li className={ultimo.status === 'PENDENTE' ? 'atual' : 'feito'}>
              {ultimo.status === 'PENDENTE'
                ? 'Aguardando Pagamentos decidir (a cada 5 s)…'
                : ultimo.status === 'PAGO'
                  ? 'Webhook APROVADA recebido: ingresso PAGO'
                  : 'Webhook RECUSADA recebido: ingresso CANCELADO e vagas devolvidas'}
            </li>
          </ol>
        </div>
      )}
    </>
  )
}
