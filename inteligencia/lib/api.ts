const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function getFaturamentoAnual() {
  const res = await fetch(`${API_URL}/api/faturamento/anual`)
  if (!res.ok) throw new Error('Erro ao buscar faturamento')
  return res.json()
}

export async function getSegmentos(tipo = 'anual') {
  const res = await fetch(`${API_URL}/api/faturamento/segmentos?tipo=${tipo}`)
  if (!res.ok) throw new Error('Erro ao buscar segmentos')
  return res.json()
}

export async function getIndicadores() {
  const res = await fetch(`${API_URL}/api/indicadores`)
  if (!res.ok) throw new Error('Erro ao buscar indicadores')
  return res.json()
}

export async function getProjecoes() {
  const res = await fetch(`${API_URL}/api/projecoes`)
  if (!res.ok) throw new Error('Erro ao buscar projeções')
  return res.json()
}

export async function getRanking(ano?: number) {
  const url = ano ? `${API_URL}/api/ranking?ano=${ano}` : `${API_URL}/api/ranking`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar ranking')
  return res.json()
}
