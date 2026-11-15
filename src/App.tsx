import Admin from './pages/Admin'
import EventoPage from './pages/EventoPage'
import Home from './pages/Home'
import MeusIngressos from './pages/MeusIngressos'
import PedidoPage from './pages/PedidoPage'
import { link, useRota, type Rota } from './rotas'

export default function App() {
  const rota = useRota()
  const naLoja = rota.nome !== 'admin'

  return (
    <div className="app">
      <header className="topo">
        <div className="topo__interno container">
          <a className="marca" href={link.home} aria-label="Plateia, página inicial">
            <svg viewBox="0 0 32 32" aria-hidden>
              <rect x="2" y="7" width="28" height="18" rx="4" />
              <circle cx="2" cy="16" r="3.5" className="marca__furo" />
              <circle cx="30" cy="16" r="3.5" className="marca__furo" />
            </svg>
            plateia
          </a>
          <nav className="menu" aria-label="Principal">
            <a href={link.home} aria-current={rota.nome === 'home' || rota.nome === 'evento' ? 'page' : undefined}>Eventos</a>
            <a href={link.meus} aria-current={rota.nome === 'meus' || rota.nome === 'pedido' ? 'page' : undefined}>Meus ingressos</a>
            <a href={link.admin()} className="menu__produtor" aria-current={rota.nome === 'admin' ? 'page' : undefined}>
              Área do produtor
            </a>
          </nav>
        </div>
      </header>

      <main id="conteudo" className={naLoja ? 'loja' : 'painel-admin'}>
        <Pagina rota={rota} />
      </main>

      <footer className="rodape">
        <div className="container rodape__interno">
          <span className="marca marca--rodape">plateia</span>
          <p>Projeto Codeplex · Bilheteria × Pagamentos. Ambiente de demonstração, nenhuma cobrança é real.</p>
          <nav aria-label="Rodapé">
            <a href={link.home}>Eventos</a>
            <a href={link.meus}>Meus ingressos</a>
            <a href={link.admin()}>Produtor</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

function Pagina({ rota }: { rota: Rota }) {
  switch (rota.nome) {
    case 'home':
      return <Home />
    case 'evento':
      return <EventoPage key={rota.id} id={rota.id} />
    case 'pedido':
      return <PedidoPage key={rota.id} id={rota.id} />
    case 'meus':
      return <MeusIngressos />
    case 'admin':
      return <Admin aba={rota.aba} />
    default:
      return (
        <div className="container estado estado--pagina">
          <p className="sobretitulo">Erro 404</p>
          <p className="estado__titulo">Esta página não existe.</p>
          <a className="botao botao--secundario" href={link.home}>Voltar para os eventos</a>
        </div>
      )
  }
}
