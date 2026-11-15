import { useEffect, useRef } from 'react'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatarMoeda = (valor: number | string | undefined | null) =>
  valor === undefined || valor === null || valor === '' ? '—' : moeda.format(Number(valor))

/** "2026-12-20" -> Date local (sem pular um dia por causa do fuso). */
export function dataLocal(iso?: string) {
  if (!iso) return null
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  if (!ano || !mes || !dia) return null
  return new Date(ano, mes - 1, dia)
}

export function formatarData(iso?: string) {
  const d = dataLocal(iso)
  return d ? d.toLocaleDateString('pt-BR') : '—'
}

/** "sábado, 20 de dezembro de 2026" */
export function formatarDataLonga(iso?: string) {
  const d = dataLocal(iso)
  return d
    ? d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
}

/** { dia: "20", mes: "dez", semana: "sáb" } para o selo de data dos cards. */
export function partesData(iso?: string) {
  const d = dataLocal(iso)
  if (!d) return { dia: '—', mes: '', semana: '' }
  return {
    dia: String(d.getDate()).padStart(2, '0'),
    mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    semana: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
  }
}

export function formatarDataHora(iso?: string) {
  if (!iso) return '—'
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return iso
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export const somenteDigitos = (texto: string) => texto.replace(/\D/g, '')

/** 12345678901 -> 123.456.789-01 (formata enquanto digita). */
export function mascaraCpf(texto: string) {
  const d = somenteDigitos(texto).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export const mascararCpf = (cpf: string) =>
  cpf.length === 11 ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}` : cpf

export function emDias(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** Imagem ilustrativa estável por evento (a API não tem foto). */
export const imagemEvento = (id: number, largura = 1200, altura = 800) =>
  `https://picsum.photos/seed/plateia-${id}/${largura}/${altura}`

const CHAVE_CPF = 'plateia.cpf'
export const cpfSalvo = () => {
  try {
    return localStorage.getItem(CHAVE_CPF) ?? ''
  } catch {
    return ''
  }
}
export const salvarCpf = (cpf: string) => {
  try {
    localStorage.setItem(CHAVE_CPF, cpf)
  } catch {
    /* navegação privada: tudo bem */
  }
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
