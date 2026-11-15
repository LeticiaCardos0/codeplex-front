import { useState, type FormEvent } from 'react'
import { bilheteria, pagamentos, verificar } from '../api'
import { Campo, Erro, Painel, Status, Vazio } from '../components'
import { useEventos, useIngressos } from '../dados'
import { link, type AbaAdmin } from '../rotas'
import type { Evento, Ingresso } from '../types'
import { emDias, formatarData, formatarMoeda, usePolling } from '../util'
import Pagamentos from './Pagamentos'

export default function Admin({ aba }: { aba: AbaAdmin }) {
  const [online, setOnline] = useState<{ bilheteria?: boolean; pagamentos?: boolean }>({})

  usePolling(async () => {
    const [b, p] = await Promise.all([verificar(bilheteria.listarEventos), verificar(pagamentos.ping)])
    setOnline({ bilheteria: b, pagamentos: p })
  }, 15000)

  return (
    <div className="container admin">
      <header className="admin__topo">
        <div>
          <p className="sobretitulo">Área do produtor</p>
          <h1 className="titulo-secao">Painel de vendas</h1>
        </div>
        <div className="servicos">
          <Servico nome="Bilheteria" online={online.bilheteria} />
          <Servico nome="Pagamentos" online={online.pagamentos} />
        </div>
      </header>

      <nav className="abas" aria-label="Seções do painel">
        <a href={link.admin('eventos')} aria-current={aba === 'eventos' ? 'page' : undefined} className="aba">Eventos e vendas</a>
        <a href={link.admin('pagamentos')} aria-current={aba === 'pagamentos' ? 'page' : undefined} className="aba">Cobranças</a>
      </nav>

      {aba === 'eventos' ? <AbaEventos /> : <Pagamentos />}
    </div>
  )
}

function Servico({ nome, online }: { nome: string; online?: boolean }) {
  const estado = online === undefined ? 'verificando' : online ? 'no ar' : 'fora do ar'
  return (
    <span className={`servico servico--${online === undefined ? 'neutro' : online ? 'on' : 'off'}`}>
      <span className="servico__ponto" aria-hidden />
      {nome} <span className="servico__estado">{estado}</span>
    </span>
  )
}

function vendasDo(evento: Evento, ingressos: Ingresso[]) {
  const doEvento = ingressos.filter((i) => i.evento?.id === evento.id)
  const vendidos = doEvento.filter((i) => i.status === 'PAGO').reduce((s, i) => s + i.quantidade, 0)
  const reservados = doEvento.filter((i) => i.status === 'PENDENTE').reduce((s, i) => s + i.quantidade, 0)
  return { vendidos, reservados, receita: vendidos * Number(evento.preco) }
}

function AbaEventos() {
  const { eventos, erro, recarregar } = useEventos(5000)
  const { ingressos } = useIngressos(5000)
  const [criando, setCriando] = useState(false)

  const lista = [...(eventos ?? [])].sort((a, b) => b.id - a.id)
  const todos = ingressos ?? []
  const totais = lista.reduce(
    (t, ev) => {
      const v = vendasDo(ev, todos)
      return { vendidos: t.vendidos + v.vendidos, receita: t.receita + v.receita }
    },
    { vendidos: 0, receita: 0 },
  )
  const pendentes = todos.filter((i) => i.status === 'PENDENTE').length

  return (
    <div className="admin__conteudo">
      <div className="metricas">
        <Metrica rotulo="Eventos publicados" valor={String(lista.length)} />
        <Metrica rotulo="Ingressos vendidos" valor={String(totais.vendidos)} />
        <Metrica rotulo="Receita confirmada" valor={formatarMoeda(totais.receita)} />
        <Metrica rotulo="Pagamentos em análise" valor={String(pendentes)} tom={pendentes ? 'pendente' : ''} />
      </div>

      <Painel
        titulo="Eventos"
        acao={
          <button className="botao botao--secundario botao--pequeno" onClick={() => setCriando((c) => !c)}>
            {criando ? 'Cancelar' : 'Novo evento'}
          </button>
        }
      >
        {criando && (
          <NovoEvento
            onCriado={() => {
              setCriando(false)
              recarregar()
            }}
          />
        )}
        <Erro erro={erro} />
        {lista.length === 0 ? (
          <Vazio>Nenhum evento publicado. Use “Novo evento” para colocar o primeiro à venda.</Vazio>
        ) : (
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Data</th>
                  <th className="num">Preço</th>
                  <th className="num">Vendidos</th>
                  <th className="num">Em análise</th>
                  <th className="num">Disponíveis</th>
                  <th className="num">Receita</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((ev) => {
                  const v = vendasDo(ev, todos)
                  return (
                    <tr key={ev.id}>
                      <td><span className="id">#{ev.id}</span> {ev.nome}</td>
                      <td>{formatarData(ev.data)}</td>
                      <td className="num">{formatarMoeda(ev.preco)}</td>
                      <td className="num">{v.vendidos}</td>
                      <td className="num">{v.reservados || '—'}</td>
                      <td className="num">{ev.vagas === 0 ? <Status valor="ESGOTADO" /> : ev.vagas}</td>
                      <td className="num">{formatarMoeda(v.receita)}</td>
                      <td><a className="link-discreto" href={link.evento(ev.id)}>Ver na loja</a></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Painel>
    </div>
  )
}

function Metrica({ rotulo, valor, tom = '' }: { rotulo: string; valor: string; tom?: string }) {
  return (
    <div className={`metrica ${tom ? `metrica--${tom}` : ''}`}>
      <span className="metrica__valor">{valor}</span>
      <span className="metrica__rotulo">{rotulo}</span>
    </div>
  )
}

function NovoEvento({ onCriado }: { onCriado: (ev: Evento) => void }) {
  const [nome, setNome] = useState('')
  const [data, setData] = useState(emDias(30))
  const [preco, setPreco] = useState('120.00')
  const [vagas, setVagas] = useState('100')
  const [erro, setErro] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      onCriado(await bilheteria.criarEvento({ nome, data, preco: Number(preco), vagas: Number(vagas) }))
    } catch (err) {
      setErro(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario formulario--destaque" onSubmit={enviar}>
      <Campo rotulo="Nome do evento">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Noite de Jazz no Sesc" maxLength={150} />
      </Campo>
      <div className="linha">
        <Campo rotulo="Data">
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <Campo rotulo="Preço (R$)">
          <input type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </Campo>
        <Campo rotulo="Lugares">
          <input type="number" min="1" value={vagas} onChange={(e) => setVagas(e.target.value)} />
        </Campo>
      </div>
      <Erro erro={erro} />
      <div>
        <button className="botao botao--primario" disabled={enviando}>{enviando ? 'Publicando…' : 'Publicar evento'}</button>
      </div>
    </form>
  )
}
