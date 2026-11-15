import { useEffect, useRef } from 'react'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatarMoeda = (valor: number | string | undefined | null) =>
  valor === undefined || valor === null || valor === '' ? '—' : moeda.format(Number(valor))

export function formatarData(iso?: string) {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarDataHora(iso?: string) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })
}

export const mascararCpf = (cpf: string) =>
  cpf.length === 11 ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}` : cpf

export function amanha() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

/** Executa `fn` agora e a cada `ms` enquanto `ativo` for true. */
export function usePolling(fn: () => void, ms: number, ativo = true) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    if (!ativo) return
    ref.current()
    const id = window.setInterval(() => ref.current(), ms)
    return () => window.clearInterval(id)
  }, [ms, ativo])
}
