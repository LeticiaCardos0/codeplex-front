import { useEffect, useState } from 'react'

export type AbaAdmin = 'eventos' | 'pagamentos'

export type Rota =
  | { nome: 'home' }
  | { nome: 'evento'; id: number }
  | { nome: 'pedido'; id: number }
  | { nome: 'meus' }
  | { nome: 'admin'; aba: AbaAdmin }
  | { nome: 'nao-encontrada' }

export const link = {
  home: '#/',
  evento: (id: number) => `#/evento/${id}`,
  pedido: (id: number) => `#/pedido/${id}`,
  meus: '#/meus-ingressos',
  admin: (aba: AbaAdmin = 'eventos') => `#/produtor/${aba}`,
}

export function lerRota(hash = window.location.hash): Rota {
  // Links antigos da versão de testes.
  if (hash === '#pagamentos') return { nome: 'admin', aba: 'pagamentos' }
  if (hash === '#bilheteria') return { nome: 'home' }

  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const [primeira, segunda] = partes
  const id = Number(segunda)

  if (!primeira) return { nome: 'home' }
  if (primeira === 'evento' && Number.isInteger(id) && id > 0) return { nome: 'evento', id }
  if (primeira === 'pedido' && Number.isInteger(id) && id > 0) return { nome: 'pedido', id }
  if (primeira === 'meus-ingressos') return { nome: 'meus' }
  if (primeira === 'produtor') return { nome: 'admin', aba: segunda === 'pagamentos' ? 'pagamentos' : 'eventos' }
  return { nome: 'nao-encontrada' }
}

export function irPara(destino: string) {
  window.location.hash = destino
}

export function useRota(): Rota {
  const [rota, setRota] = useState<Rota>(() => lerRota())
  useEffect(() => {
    const aoMudar = () => {
      setRota(lerRota())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])
  return rota
}
