import { useMemo, useState } from 'react'
import { Imagem, SeloData, mensagemCliente } from '../components'
import { eventosAVenda, useEventos } from '../dados'
import { link } from '../rotas'
import type { Evento } from '../types'
import { formatarDataLonga, formatarMoeda, imagemEvento } from '../util'

export default function Home() {
  const { eventos, erro, recarregar } = useEventos()
  const [busca, setBusca] = useState('')

  const aVenda = useMemo(() => (eventos ? eventosAVenda(eventos) : []), [eventos])
  const destaque = aVenda.find((e) => e.vagas > 0) ?? aVenda[0]
  const filtrados = aVenda.filter((e) => e.nome.toLowerCase().includes(busca.trim().toLowerCase()))

  return (
    <>
      {destaque ? <Destaque evento={destaque} /> : <HeroVazio carregando={!eventos && !erro} />}

      <section className="vitrine container" aria-labelledby="titulo-vitrine">
        <div className="vitrine__topo">
          <div>
            <p className="sobretitulo">Em cartaz</p>
            <h2 id="titulo-vitrine" className="titulo-secao">Próximos eventos</h2>
          </div>
          <label className="busca">
            <span className="sr-only">Buscar evento</span>
            <svg viewBox="0 0 24 24" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              type="search"
              placeholder="Buscar por nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>
        </div>

        {erro && !eventos ? (
          <div className="estado">
            <p className="estado__titulo">Não conseguimos carregar os eventos agora.</p>
            <p className="estado__texto">{mensagemCliente(erro)}</p>
            <button className="botao botao--secundario" onClick={recarregar}>Tentar de novo</button>
          </div>
        ) : !eventos ? (
          <div className="grade-eventos">
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="card-esqueleto" />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="estado">
            <p className="estado__titulo">
              {busca ? `Nada encontrado para “${busca}”.` : 'Nenhum evento à venda no momento.'}
            </p>
            <p className="estado__texto">
              {busca ? 'Confira a grafia ou limpe a busca.' : 'Novas datas aparecem aqui assim que forem publicadas.'}
            </p>
            {busca ? (
              <button className="botao botao--secundario" onClick={() => setBusca('')}>Limpar busca</button>
            ) : (
              <a className="botao botao--secundario" href={link.admin('eventos')}>Publicar um evento</a>
            )}
          </div>
        ) : (
          <ul className="grade-eventos">
            {filtrados.map((ev, i) => (
              <li key={ev.id} className="entrar" style={{ ['--i' as string]: Math.min(i, 8) }}>
                <CardEvento evento={ev} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="vantagens container" aria-label="Como funciona">
        <div>
          <span className="vantagens__num">01</span>
          <h3>Escolha o evento</h3>
          <p>Veja data, preço e quantos ingressos ainda restam antes de comprar.</p>
        </div>
        <div>
          <span className="vantagens__num">02</span>
          <h3>Pague com cartão</h3>
          <p>Seus lugares ficam reservados enquanto o pagamento é confirmado.</p>
        </div>
        <div>
          <span className="vantagens__num">03</span>
          <h3>Receba o ingresso</h3>
          <p>Em poucos segundos ele aparece em Meus ingressos, pronto para a entrada.</p>
        </div>
      </section>
    </>
  )
}

function Destaque({ evento }: { evento: Evento }) {
  const esgotado = evento.vagas === 0
  return (
    <section className="destaque" aria-labelledby="titulo-destaque">
      <Imagem src={imagemEvento(evento.id, 1920, 1080)} alt="" className="destaque__fundo" />
      <div className="destaque__conteudo container">
        <p className="sobretitulo sobretitulo--claro">Em destaque</p>
        <h1 id="titulo-destaque" className="destaque__titulo">{evento.nome}</h1>
        <p className="destaque__meta">
          <span className="primeira-maiuscula">{formatarDataLonga(evento.data)}</span>
          <span aria-hidden>·</span>
          <span>a partir de <strong>{formatarMoeda(evento.preco)}</strong></span>
        </p>
        <div className="destaque__acoes">
          <a className="botao botao--primario botao--grande" href={link.evento(evento.id)}>
            {esgotado ? 'Ver detalhes' : 'Garantir ingresso'}
          </a>
          {!esgotado && evento.vagas <= 10 && (
            <span className="aviso-vagas">Restam {evento.vagas} {evento.vagas === 1 ? 'ingresso' : 'ingressos'}</span>
          )}
        </div>
      </div>
    </section>
  )
}

function HeroVazio({ carregando }: { carregando: boolean }) {
  return (
    <section className="hero-vazio">
      <div className="container">
        <p className="sobretitulo">Plateia</p>
        <h1 className="hero-vazio__titulo">Os melhores lugares da cidade, sem fila.</h1>
        <p className="hero-vazio__texto">
          {carregando ? 'Carregando a programação…' : 'Shows, peças e festas com ingresso confirmado na hora.'}
        </p>
      </div>
    </section>
  )
}

function CardEvento({ evento }: { evento: Evento }) {
  const esgotado = evento.vagas === 0
  const poucas = !esgotado && evento.vagas <= 5
  return (
    <a className={`card-evento ${esgotado ? 'card-evento--esgotado' : ''}`} href={link.evento(evento.id)}>
      <div className="card-evento__midia">
        <Imagem src={imagemEvento(evento.id, 800, 600)} alt={`Imagem ilustrativa de ${evento.nome}`} />
        <SeloData iso={evento.data} />
        {esgotado && <span className="etiqueta etiqueta--escura">Esgotado</span>}
        {poucas && <span className="etiqueta">Últimos {evento.vagas}</span>}
      </div>
      <div className="card-evento__corpo">
        <h3 className="card-evento__nome">{evento.nome}</h3>
        <p className="card-evento__data primeira-maiuscula">{formatarDataLonga(evento.data)}</p>
        <div className="card-evento__rodape">
          <span className="card-evento__preco">
            <small>a partir de</small>
            {formatarMoeda(evento.preco)}
          </span>
          <span className="card-evento__seta" aria-hidden>→</span>
        </div>
      </div>
    </a>
  )
}
