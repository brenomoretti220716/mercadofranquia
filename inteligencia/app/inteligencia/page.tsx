import { getFaturamentoAnual, getSegmentos, getIndicadores, getProjecoes, getRanking, getMacroBCB, getMacroIBGE, getVarejoPMC, getEmpregoCaged, getConsumidorPainel } from "@/lib/api"
import NavTabs from "@/components/nav-tabs"

export default async function InteligenciaPage() {
  const [anual, segmentos, indicadores, projecoes, ranking, selic, ipca, dolar, desemprego, pibTrimestral, pibEstado, pmcData, cagedComercio, cagedServicos, consumidorPainel] = await Promise.all([
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
  ])

  // Pré-processar dados comuns
  const totais = anual
    .filter((r: any) => r.segmento === "Total")
    .sort((a: any, b: any) => a.periodo.localeCompare(b.periodo))

  const ultimo = totais[totais.length - 1]
  const penultimo = totais[totais.length - 2]
  const varAnual = penultimo ? (((ultimo.valor_mm / penultimo.valor_mm) - 1) * 100).toFixed(1) : null

  const segs = segmentos
    .filter((r: any) => r.periodo === "4T2023" && r.segmento !== "Total")
    .sort((a: any, b: any) => b.valor_mm - a.valor_mm)

  const emprego = indicadores.filter((r: any) => r.empregos_diretos).pop()

  const serieAnual = totais.map((r: any) => ({
    periodo: r.periodo,
    valor_bi: Math.round(r.valor_mm / 1000),
  }))

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
    { label: "Faturamento 2024", valor: `R$ ${(ultimo.valor_mm / 1000).toFixed(0)} bi`, sub: `+${varAnual}% vs 2023`, cor: "#1D9E75" },
    { label: "Crescimento 11 anos", valor: "+108%", sub: "R$ 127 bi para R$ 265 bi", cor: "#888" },
    { label: "Empregos diretos", valor: emprego ? `${(emprego.empregos_diretos / 1000000).toFixed(2)} mi` : "1,80 mi", sub: `~${empregosPorUnidade} por unidade`, cor: "#888" },
    { label: "Serie historica", valor: "11 anos", sub: `${totais.length} periodos anuais`, cor: "#888" },
  ]

  return (
    <main className="min-h-screen p-8" style={{ background: "#f4f3ef" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#1D9E75" }}>
            Franquias Intelligence
          </p>
          <h1 className="text-3xl font-medium" style={{ color: "#1a1a18" }}>
            Mercado de Franchising Brasileiro
          </h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>
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
          }}
        />

        <p className="text-center mt-8" style={{ fontSize: 11, color: "#ccc" }}>
          Fonte: ABF · BCB · IBGE/PMC · CAGED · FGV · mercadofranquia.com.br/inteligencia
        </p>
      </div>
    </main>
  )
}
