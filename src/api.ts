import type { Cobranca, ErroDetalhe, Evento, Ingresso } from './types'

const BILHETERIA = '/api/bilheteria'
const PAGAMENTOS = '/api/pagamentos'

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensagem: string,
    public detalhes: ErroDetalhe[] = [],
  ) {
    super(mensagem)
  }

  get offline() {
    // 502/503/504 = gateway (Vite ou ngrok) não alcançou o backend.
    return this.codigo === 'servico_offline' || [0, 502, 503, 504].includes(this.status)
  }
}

async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(0, 'servico_offline', 'Não foi possível conectar ao front (Vite).')
  }

  const texto = await resposta.text()
  let corpo: unknown = null
  if (texto) {
    try {
      corpo = JSON.parse(texto)
    } catch {
      corpo = null
    }
  }

  if (!resposta.ok) {
    const erro = (corpo ?? {}) as { codigo?: string; mensagem?: string; detalhes?: ErroDetalhe[] }
    throw new ApiError(
      resposta.status,
      erro.codigo ?? `http_${resposta.status}`,
      erro.mensagem ?? `Erro HTTP ${resposta.status}`,
      Array.isArray(erro.detalhes) ? erro.detalhes : [],
    )
  }
  return corpo as T
}

const json = (corpo: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(corpo) })

export const bilheteria = {
  listarEventos: () => requisitar<Evento[]>(`${BILHETERIA}/eventos`),
  obterEvento: (id: number) => requisitar<Evento>(`${BILHETERIA}/eventos/${id}`),
  criarEvento: (dados: { nome: string; data: string; preco: number; vagas: number }) =>
    requisitar<Evento>(`${BILHETERIA}/eventos`, json(dados)),
  comprar: (eventoId: number, dados: { cpf: string; quantidade: number; cartao_final: string }) =>
    requisitar<Ingresso>(`${BILHETERIA}/eventos/${eventoId}/comprar`, json(dados)),
  listarIngressos: () => requisitar<Ingresso[]>(`${BILHETERIA}/ingressos`),
  obterIngresso: (id: number) => requisitar<Ingresso>(`${BILHETERIA}/ingressos/${id}`),
}

export const pagamentos = {
  /** Não faz parte do contrato: só funciona se o time de Pagamentos expuser GET /cobrancas. */
  listarCobrancas: () => requisitar<Cobranca[]>(`${PAGAMENTOS}/cobrancas`),
  obterCobranca: (id: number) => requisitar<Cobranca>(`${PAGAMENTOS}/cobrancas/${id}`),
}

/**
 * Um serviço está "no ar" se respondeu qualquer coisa vinda do backend
 * (até 404). Só 502 servico_offline do proxy conta como fora do ar.
 */
export async function verificar(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn()
    return true
  } catch (e) {
    return !(e instanceof ApiError && e.offline)
  }
}
