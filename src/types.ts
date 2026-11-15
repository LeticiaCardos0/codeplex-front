// Contratos em snake_case, como as APIs devolvem.

export interface Evento {
  id: number
  nome: string
  data: string
  preco: number
  vagas: number
  criado_em?: string
}

export type StatusIngresso = 'PENDENTE' | 'PAGO' | 'CANCELADO'

export interface Ingresso {
  id: number
  cpf: string
  quantidade: number
  cobranca_id: number
  status: StatusIngresso
  evento: Evento
  criado_em: string
}

export type StatusCobranca = 'PENDENTE' | 'APROVADA' | 'RECUSADA'

export interface Cobranca {
  id: number
  valor: number
  status: StatusCobranca
  cartao_final?: string
  evento_id?: number
  quantidade?: number
  callback_url?: string
  tentativas_webhook?: number
  webhook_entregue?: boolean
  criado_em?: string
}

export interface ErroDetalhe {
  campo?: string
  mensagem?: string
}

export interface ErroResposta {
  codigo: string
  mensagem: string
  detalhes?: ErroDetalhe[]
}
