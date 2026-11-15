import { useEffect, useState } from 'react'
import { bilheteria, pagamentos, verificar } from './api'
import Bilheteria from './pages/Bilheteria'
import Pagamentos from './pages/Pagamentos'
import { usePolling } from './util'

type Aba = 'bilheteria' | 'pagamentos'

const abaDaUrl = (): Aba => (window.location.hash === '#pagamentos' ? 'pagamentos' : 'bilheteria')

export default function App() {
  const [aba, setAba] = useState<Aba>(abaDaUrl)
  const [online, setOnline] = useState<{ bilheteria?: boolean; pagamentos?: boolean }>({})

  useEffect(() => {
    const aoMudar = () => setAba(abaDaUrl())
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])

  usePolling(async () => {
    const [b, p] = await Promise.all([
      verificar(bilheteria.listarEventos),
      verificar(pagamentos.ping),
    ])
    setOnline({ bilheteria: b, pagamentos: p })
  }, 15000)

  return (
    <div className={`app app--${aba}`}>
      <header className="topo">
        <div className="topo__marca">
          <span className="logo" aria-hidden>🎟️</span>
          <div>
            <h1>Codeplex</h1>
            <p>Bilheteria × Pagamentos</p>
          </div>
        </div>

        <nav className="abas" role="tablist">
          <a href="#bilheteria" role="tab" aria-selected={aba === 'bilheteria'} className="aba aba--bilheteria">
            Bilheteria
          </a>
          <a href="#pagamentos" role="tab" aria-selected={aba === 'pagamentos'} className="aba aba--pagamentos">
            Pagamentos
          </a>
        </nav>

        <div className="servicos">
          <Servico nome="Bilheteria :8080" online={online.bilheteria} />
          <Servico nome="Pagamentos :8081" online={online.pagamentos} />
        </div>
      </header>

      <main className="conteudo">{aba === 'bilheteria' ? <Bilheteria /> : <Pagamentos />}</main>
    </div>
  )
}

function Servico({ nome, online }: { nome: string; online?: boolean }) {
  const estado = online === undefined ? 'verificando' : online ? 'no ar' : 'fora do ar'
  return (
    <span className={`servico servico--${online === undefined ? 'neutro' : online ? 'on' : 'off'}`} title={estado}>
      <span className="servico__ponto" aria-hidden />
      {nome}
      <span className="sr-only"> {estado}</span>
    </span>
  )
}
