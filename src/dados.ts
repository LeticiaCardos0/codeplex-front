import { useCallback, useState } from 'react'
import { bilheteria } from './api'
import type { Evento, Ingresso } from './types'
import { usePolling } from './util'

/** Eventos da Bilheteria, atualizados a cada `ms`. */
export function useEventos(ms = 10000) {
  const [eventos, setEventos] = useState<Evento[] | null>(null)
  const [erro, setErro] = useState<unknown>(null)

  const recarregar = useCallback(async () => {
    try {
      const lista = await bilheteria.listarEventos()
      setEventos(lista)
      setErro(null)
    } catch (e) {
      setErro(e)
    }
  }, [])

  usePolling(recarregar, ms)
  return { eventos, erro, recarregar }
}

export function useIngressos(ms = 5000, ativo = true) {
  const [ingressos, setIngressos] = useState<Ingresso[] | null>(null)
  const [erro, setErro] = useState<unknown>(null)

  const recarregar = useCallback(async () => {
    try {
      setIngressos(await bilheteria.listarIngressos())
      setErro(null)
    } catch (e) {
      setErro(e)
    }
  }, [])

  usePolling(recarregar, ms, ativo)
  return { ingressos, erro, recarregar }
}

/** Eventos à venda: data de hoje em diante, mais próximos primeiro. */
export function eventosAVenda(eventos: Evento[]) {
  const hoje = new Date().toISOString().slice(0, 10)
  return eventos
    .filter((e) => (e.data ?? '') >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
}
