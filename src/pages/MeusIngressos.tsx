import { useState, type FormEvent } from 'react'
import { Erro, Imagem, StatusPedido } from '../components'
import { useIngressos } from '../dados'
import { link } from '../rotas'
import { cpfSalvo, formatarDataLonga, formatarMoeda, imagemEvento, mascaraCpf, salvarCpf, somenteDigitos } from '../util'

export default function MeusIngressos() {
  const [cpf, setCpf] = useState(() => cpfSalvo())
  const [digitado, setDigitado] = useState(() => mascaraCpf(cpfSalvo()))
  const temPendente = (lista: { status: string }[] | null) => !!lista?.some((i) => i.status === 'PENDENTE')
  const { ingressos, erro } = useIngressos(4000, cpf.length === 11)

  const meus = (ingressos ?? []).filter((i) => i.cpf === cpf).sort((a, b) => b.id - a.id)

  function buscar(e: FormEvent) {
    e.preventDefault()
    const limpo = somenteDigitos(digitado)
    if (limpo.length !== 11) return
    salvarCpf(limpo)
    setCpf(limpo)
  }

  return (
    <div className="container meus">
      <header className="meus__topo">
        <div>
          <p className="sobretitulo">Sua conta</p>
          <h1 className="titulo-secao">Meus ingressos</h1>
        </div>
        <form className="meus__busca" onSubmit={buscar}>
          <label className="sr-only" htmlFor="cpf-meus">CPF</label>
          <input
            id="cpf-meus"
            value={digitado}
            onChange={(e) => setDigitado(mascaraCpf(e.target.value))}
            placeholder="Digite seu CPF"
            inputMode="numeric"
          />
          <button className="botao botao--primario" disabled={somenteDigitos(digitado).length !== 11}>Ver ingressos</button>
        </form>
      </header>

      {cpf.length !== 11 ? (
        <div className="estado">
          <p className="estado__titulo">Informe o CPF usado na compra.</p>
          <p className="estado__texto">Seus ingressos ficam vinculados ao CPF do titular.</p>
        </div>
      ) : erro && !ingressos ? (
        <Erro erro={erro} cliente />
      ) : !ingressos ? (
        <div className="lista-ingressos">
          {[0, 1].map((i) => <div key={i} className="card-esqueleto card-esqueleto--baixo" />)}
        </div>
      ) : meus.length === 0 ? (
        <div className="estado">
          <p className="estado__titulo">Nenhum ingresso para o CPF {mascaraCpf(cpf)}.</p>
          <a className="botao botao--secundario" href={link.home}>Ver eventos</a>
        </div>
      ) : (
        <>
          {temPendente(meus) && <p className="meus__aviso">Há pagamentos em confirmação. Esta lista se atualiza sozinha.</p>}
          <ul className="lista-ingressos">
            {meus.map((i) => (
              <li key={i.id}>
                <a className={`linha-ingresso ${i.status === 'CANCELADO' ? 'linha-ingresso--cancelado' : ''}`} href={link.pedido(i.id)}>
                  <Imagem src={imagemEvento(i.evento.id, 300, 300)} alt="" className="linha-ingresso__img" />
                  <div className="linha-ingresso__info">
                    <h2>{i.evento.nome}</h2>
                    <p className="primeira-maiuscula">{formatarDataLonga(i.evento.data)}</p>
                    <p className="linha-ingresso__meta">
                      {i.quantidade} {i.quantidade === 1 ? 'ingresso' : 'ingressos'} ·{' '}
                      {formatarMoeda(Number(i.evento.preco) * i.quantidade)} · pedido #{i.id}
                    </p>
                  </div>
                  <StatusPedido valor={i.status} />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
