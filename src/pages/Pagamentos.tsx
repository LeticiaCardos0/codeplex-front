import { useCallback, useState, type FormEvent } from 'react'
import { ApiError, bilheteria, pagamentos } from '../api'
import { Campo, Erro, Painel, Status, Vazio } from '../components'
import type { Cobranca } from '../types'
import { formatarDataHora, formatarMoeda, usePolling } from '../util'

type Origem = 'lista' | 'ingressos'

// Guardados fora do componente para valer entre trocas de aba.
/** Se o Pagamentos não tem GET /cobrancas (404/405), não tenta de novo. */
let listaIndisponivel = false
/** Cobranças já finalizadas (decididas e com webhook entregue) não mudam mais: não busca de novo. */
const finalizadas = new Map<number, Cobranca>()
/** cobranca_id que deram 404 (ex.: Pagamentos zerou o banco): não busca de novo. */
const inexistentes = new Set<number>()

const finalizada = (c: Cobranca) => c.status !== 'PENDENTE' && c.webhook_entregue !== false

export default function Pagamentos() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [origem, setOrigem] = useState<Origem>(listaIndisponivel ? 'ingressos' : 'lista')
  const [erro, setErro] = useState<unknown>(null)

  const recarregar = useCallback(async () => {
    if (!listaIndisponivel) {
      try {
        // 1ª opção: GET /cobrancas (se o time de Pagamentos tiver).
        const lista = await pagamentos.listarCobrancas()
        setCobrancas([...lista].sort((a, b) => b.id - a.id))
        setOrigem('lista')
        setErro(null)
        return
      } catch (e) {
        if (e instanceof ApiError && e.offline) {
          setErro(e)
          return
        }
        listaIndisponivel = true
      }
    }
    // 2ª opção (só contrato): pega as cobranca_id dos ingressos e busca GET /cobrancas/{id},
    // apenas das que ainda podem mudar.
    try {
      const ingressos = await bilheteria.listarIngressos()
      const ids = [...new Set(ingressos.map((i) => i.cobranca_id))]
      const aBuscar = ids.filter((id) => !finalizadas.has(id) && !inexistentes.has(id))
      const resultados = await Promise.allSettled(aBuscar.map((id) => pagamentos.obterCobranca(id)))
      let offline: unknown = null
      resultados.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          if (finalizada(r.value)) finalizadas.set(r.value.id, r.value)
        } else if (r.reason instanceof ApiError && r.reason.offline) {
          offline = r.reason
        } else if (r.reason instanceof ApiError && r.reason.status === 404) {
          inexistentes.add(aBuscar[i])
        }
      })
      const abertas = resultados.flatMap((r) => (r.status === 'fulfilled' && !finalizada(r.value) ? [r.value] : []))
      const todas = [...abertas, ...ids.flatMap((id) => (finalizadas.has(id) ? [finalizadas.get(id)!] : []))]
      setCobrancas(todas.sort((a, b) => b.id - a.id))
      setOrigem('ingressos')
      setErro(offline)
    } catch (e) {
      setErro(e)
    }
  }, [])

  const temPendente = cobrancas.some((c) => c.status === 'PENDENTE' || c.webhook_entregue === false)
  usePolling(recarregar, temPendente ? 1500 : 4000)

  const total = (s: Cobranca['status']) => cobrancas.filter((c) => c.status === s).length

  return (
    <div className="grade grade--pagamentos">
      <div className="coluna coluna--larga">
        <div className="metricas">
          <Metrica rotulo="Cobranças" valor={cobrancas.length} />
          <Metrica rotulo="Pendentes" valor={total('PENDENTE')} tom="pendente" />
          <Metrica rotulo="Aprovadas" valor={total('APROVADA')} tom="ok" />
          <Metrica rotulo="Recusadas" valor={total('RECUSADA')} tom="erro" />
        </div>

        <Painel
          titulo="Cobranças"
          acao={
            <span className="suave pequeno">
              {origem === 'lista' ? 'GET /cobrancas' : 'via cobranca_id dos ingressos · GET /cobrancas/{id}'}
            </span>
          }
        >
          <Erro erro={erro} />
          {cobrancas.length === 0 ? (
            <Vazio>
              Nenhuma cobrança ainda. Faça uma compra na aba Bilheteria: ela cria a cobrança aqui.
            </Vazio>
          ) : (
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>#</th>
                    <th className="num">Evento</th>
                    <th className="num">Qtd</th>
                    <th className="num">Valor</th>
                    <th>Cartão</th>
                    <th>Status</th>
                    <th className="num">Tentativas webhook</th>
                    <th>Webhook</th>
                    <th>Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {cobrancas.map((c) => (
                    <tr key={c.id}>
                      <td className="id">{c.id}</td>
                      <td className="num mono">{c.evento_id ?? '—'}</td>
                      <td className="num">{c.quantidade ?? '—'}</td>
                      <td className="num">{formatarMoeda(c.valor)}</td>
                      <td className="mono">{c.cartao_final ? `•••• ${c.cartao_final}` : '—'}</td>
                      <td><Status valor={c.status} /></td>
                      <td className="num">{c.tentativas_webhook ?? '—'}</td>
                      <td>
                        {c.webhook_entregue === undefined ? '—' : c.webhook_entregue ? (
                          <span className="entregue">entregue</span>
                        ) : (
                          <span className="suave">não entregue</span>
                        )}
                      </td>
                      <td className="suave">{formatarDataHora(c.criado_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Painel>
      </div>

      <div className="coluna">
        <Consulta />
        <Painel titulo="Como funciona (Rodada 3)">
          <ol className="passos">
            <li>A Bilheteria chama <code>POST /cobrancas</code> com a <code>callback_url</code>.</li>
            <li>Pagamentos confere o preço em <code>GET /eventos/&#123;id&#125;</code> e grava <b>PENDENTE</b>.</li>
            <li>A cada 5 s aplica a regra do cartão: <code>0000</code> recusa, o resto aprova.</li>
            <li>Faz <code>POST</code> na <code>callback_url</code> com <code>cobranca_id</code> e <code>status</code>.</li>
          </ol>
        </Painel>
      </div>
    </div>
  )
}

function Metrica({ rotulo, valor, tom = '' }: { rotulo: string; valor: number; tom?: string }) {
  return (
    <div className={`metrica ${tom ? `metrica--${tom}` : ''}`}>
      <span className="metrica__valor">{valor}</span>
      <span className="metrica__rotulo">{rotulo}</span>
    </div>
  )
}

function Consulta() {
  const [id, setId] = useState('')
  const [cobranca, setCobranca] = useState<Cobranca | null>(null)
  const [erro, setErro] = useState<unknown>(null)

  async function buscar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCobranca(null)
    try {
      setCobranca(await pagamentos.obterCobranca(Number(id)))
    } catch (err) {
      setErro(err)
    }
  }

  return (
    <Painel titulo="Consultar cobrança">
      <form className="formulario formulario--inline" onSubmit={buscar}>
        <Campo rotulo="Id da cobrança">
          <input type="number" min={1} value={id} onChange={(e) => setId(e.target.value)} placeholder="ex.: 1" />
        </Campo>
        <button className="botao botao--pagamentos" disabled={!id}>Buscar</button>
      </form>
      <Erro erro={erro} />
      {cobranca && (
        <pre className="json">{JSON.stringify(cobranca, null, 2)}</pre>
      )}
    </Painel>
  )
}
