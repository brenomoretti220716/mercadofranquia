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

export async function getMacroBCB(serie: string, anos = 5) {
  const res = await fetch(`${API_URL}/api/macro/bcb?serie=${serie}&anos=${anos}`)
  if (!res.ok) throw new Error(`Erro ao buscar série BCB: ${serie}`)
  return res.json()
}

export async function getMacroIBGE(indicador: string) {
  const res = await fetch(`${API_URL}/api/macro/ibge?indicador=${indicador}`)
  if (!res.ok) throw new Error(`Erro ao buscar indicador IBGE: ${indicador}`)
  return res.json()
}

export async function getVarejoPMC(meses = 36) {
  const res = await fetch(`${API_URL}/api/varejo/pmc?meses=${meses}`)
  if (!res.ok) throw new Error('Erro ao buscar PMC')
  return res.json()
}

export async function getConsumidorPainel(anos = 3) {
  const res = await fetch(`${API_URL}/api/consumidor/painel?anos=${anos}`)
  if (!res.ok) throw new Error('Erro ao buscar painel do consumidor')
  return res.json()
}

export async function getEmpregoCaged(setor?: string, meses = 36) {
  const params = new URLSearchParams({ meses: String(meses) })
  if (setor) params.set('setor', setor)
  const res = await fetch(`${API_URL}/api/emprego/caged?${params}`)
  if (!res.ok) throw new Error(`Erro ao buscar CAGED: ${setor}`)
  return res.json()
}
