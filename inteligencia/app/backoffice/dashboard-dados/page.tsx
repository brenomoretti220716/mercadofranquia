import { getFaturamentoAnual, getSegmentos, getIndicadores, getProjecoes, getRanking, getMacroBCB, getMacroIBGE, getVarejoPMC, getEmpregoCaged, getConsumidorPainel, getInvestimentoPorSegmento } from "@/lib/api"
import NavTabs from "@/components/nav-tabs"

export default async function DashboardDadosPage() {
  const [anual, segmentos, indicadores, projecoes, ranking, selic, ipca, dolar, desemprego, pibTrimestral, pibEstado, pmcData, cagedComercio, cagedServicos, consumidorPainel, investSegmento] = await Promise.all([
    getFaturamentoAnual(),
    getSegmentos("anual"),
    getIndicadores(),
    getProjecoes(),
    getRanking(),
    getMacroBCB("selic", 3),
    getMacroBCB("ipca", 3),
    getMacroBCB("dolar", 3),
    getMacroBCB("desemprego", 3),
    getMacroBCB("pib", 10),
    getMacroIBGE("pib_estado"),
    getVarejoPMC(36),
    getEmpregoCaged("comercio", 36),
    getEmpregoCaged("servicos", 36),
    getConsumidorPainel(3),
    getInvestimentoPorSegmento(),
  ])

  const totais = anual
    .filter((r: any) => r.segmento === "Total")
    .sort((a: any, b: any) => a.periodo.localeCompare(b.periodo))

  const ultimo = totais[totais.length - 1]
  const penultimo = totais[totais.length - 2]
  const varAnual = penultimo ? (((ultimo.valor_mm / penultimo.valor_mm) - 1) * 100).toFixed(1) : null

  // 2025 parcial: soma dos segmentos 12m acumulado do 3T2025
  const segs2025 = segmentos.filter((r: any) => r.periodo === "3T2025")
  const fat2025parcial = segs2025.reduce((acc: number, r: any) => acc + r.valor_mm, 0)

  // Segmentos para ranking: pegar 3T2025 (12m) se disponível, senão 4T2023
  const segs = (segs2025.length > 0 ? segs2025 : segmentos.filter((r: any) => r.periodo === "4T2023"))
    .filter((r: any) => r.segmento !== "Total")
    .sort((a: any, b: any) => b.valor_mm - a.valor_mm)

  const emprego = indicadores.filter((r: any) => r.empregos_diretos).pop()

  const serieAnual = [
    ...totais.map((r: any) => ({
      periodo: r.periodo,
      valor_bi: Math.round(r.valor_mm / 1000),
      parcial: false,
    })),
    ...(fat2025parcial > 0 ? [{
      periodo: "2025*",
      valor_bi: Math.round(fat2025parcial / 1000),
      parcial: true,
    }] : []),
  ]

  const serieEmpregos = indicadores
    .filter((r: any) => r.empregos_diretos)
    .sort((a: any, b: any) => a.ano - b.ano)
    .map((r: any) => ({
      ano: String(r.ano),
      empregos: r.empregos_diretos,
      empregos_mi: +(r.empregos_diretos / 1_000_000).toFixed(2),
    }))

  const ultimoInd = indicadores
    .filter((r: any) => r.empregos_diretos && r.unidades)
    .sort((a: any, b: any) => a.ano - b.ano)
    .pop()
  const empregosPorUnidade = ultimoInd ? Math.round(ultimoInd.empregos_diretos / ultimoInd.unidades) : 9

  const segAnual = segmentos.filter((r: any) => r.segmento !== "Total")

  const kpis = [
    { label: "Faturamento 2025 (parcial)", valor: fat2025parcial > 0 ? `R$ ${Math.round(fat2025parcial / 1000)} bi` : `R$ ${(ultimo.valor_mm / 1000).toFixed(0)} bi`, sub: fat2025parcial > 0 ? `Acumulado 12m ate 3T2025` : `+${varAnual}% vs 2023`, cor: "#E8421A" },
    { label: "Crescimento 11 anos", valor: "+108%", sub: "R$ 127 bi (2014) → R$ 265 bi (2024)", cor: "#999" },
    { label: "Empregos diretos", valor: emprego ? `${(emprego.empregos_diretos / 1000000).toFixed(2)} mi` : "1,80 mi", sub: `~${empregosPorUnidade} por unidade`, cor: "#999" },
    { label: "Franquias no banco", valor: "1.387", sub: "Mercado Franquia", cor: "#999" },
  ]

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
            Intelligence Dashboard
          </h1>
          <span className="text-[10px] font-semibold px-2 py-0.5" style={{ background: "#FFF0ED", color: "#E8421A", borderRadius: 6 }}>
            BETA
          </span>
        </div>
        <p className="text-sm" style={{ color: "#666" }}>
          Dados ABF 2014-2025 · BCB · IBGE · CAGED · Atualizado Mar/2026
        </p>
      </div>

      <NavTabs
        data={{
          kpis,
          serieAnual,
          segmentos: segs,
          segmentosAnual: segAnual,
          projecoes,
          ranking,
          serieEmpregos,
          indicadores,
          anual,
          selic,
          ipca,
          dolar,
          desemprego,
          pibTrimestral,
          pibEstado,
          pmcData,
          cagedComercio,
          cagedServicos,
          consumidorPainel,
          empregosAbf: emprego?.empregos_diretos ?? null,
          investSegmento,
          trimestrais: anual.filter((r: any) => r.tipo_dado === "trimestral" && r.segmento === "Total"),
        }}
      />

      <p className="text-center mt-8" style={{ fontSize: 11, color: "#BBB" }}>
        Fonte: ABF · BCB · IBGE/PMC · CAGED · FGV · mercadofranquia.com.br
      </p>
    </>
  )
}
