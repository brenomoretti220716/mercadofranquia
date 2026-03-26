import { getFaturamentoAnual, getSegmentos, getIndicadores, getProjecoes, getRanking, getMacroBCB, getMacroIBGE, getVarejoPMC, getEmpregoCaged, getConsumidorPainel } from "@/lib/api"
import Dashboard from "./dashboard"
import { CenarioMacro, FranchisingVsEconomia, PibPorEstado } from "@/components/macro-charts"
import { FranchisingVsVarejo, EmpregoFormal } from "@/components/comparativo-charts"
import { PainelConsumidor } from "@/components/consumidor-charts"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: "#1a1a18" }}>
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: "#e0dfda" }} />
    </div>
  )
}

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

  const totais = anual
    .filter((r: any) => r.segmento === "Total")
    .sort((a: any, b: any) => a.periodo.localeCompare(b.periodo))

  const ultimo = totais[totais.length - 1]
  const penultimo = totais[totais.length - 2]
  const varAnual = penultimo
    ? (((ultimo.valor_mm / penultimo.valor_mm) - 1) * 100).toFixed(1)
    : null

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

  const serieUnidades = indicadores
    .filter((r: any) => r.unidades)
    .sort((a: any, b: any) => a.ano - b.ano)

  const ultimoInd = indicadores
    .filter((r: any) => r.empregos_diretos && r.unidades)
    .sort((a: any, b: any) => a.ano - b.ano)
    .pop()

  const empregosPorUnidade = ultimoInd
    ? Math.round(ultimoInd.empregos_diretos / ultimoInd.unidades)
    : 9

  const segAnual = segmentos
    .filter((r: any) => r.segmento !== "Total")

  const kpis = [
    {
      label: "Faturamento 2024",
      valor: `R$ ${(ultimo.valor_mm / 1000).toFixed(0)} bi`,
      sub: `+${varAnual}% vs 2023`,
      cor: "#1D9E75",
    },
    {
      label: "Crescimento 11 anos",
      valor: "+108%",
      sub: "R$ 127 bi para R$ 265 bi",
      cor: "#888",
    },
    {
      label: "Empregos diretos",
      valor: emprego
        ? `${(emprego.empregos_diretos / 1000000).toFixed(2)} mi`
        : "1,80 mi",
      sub: `~${empregosPorUnidade} por unidade`,
      cor: "#888",
    },
    {
      label: "Serie historica",
      valor: "11 anos",
      sub: `${totais.length} periodos anuais`,
      cor: "#888",
    },
  ]

  return (
    <main className="min-h-screen p-8" style={{ background: "#f4f3ef" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#1D9E75" }}>
            Franquias Intelligence
          </p>
          <h1 className="text-3xl font-medium" style={{ color: "#1a1a18" }}>
            Mercado de Franchising Brasileiro
          </h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>
            Dados ABF 2014-2025 · Atualizado Mar/2026
          </p>
        </div>

        <Dashboard
          kpis={kpis}
          serieAnual={serieAnual}
          segmentos={segs}
          segmentosAnual={segAnual}
          projecoes={projecoes}
          ranking={ranking}
          serieEmpregos={serieEmpregos}
          indicadores={indicadores}
        />

        {/* SEÇÃO: Cenário Macroeconômico */}
        <SectionTitle>Cenário Macroeconômico</SectionTitle>
        <CenarioMacro selic={selic} ipca={ipca} dolar={dolar} desemprego={desemprego} />

        {/* SEÇÃO: Franchising vs Economia */}
        <SectionTitle>Franchising vs Economia</SectionTitle>
        <FranchisingVsEconomia fatAnual={anual} pibTrimestral={pibTrimestral} />

        {/* SEÇÃO: PIB por Estado */}
        <SectionTitle>PIB por Estado</SectionTitle>
        <PibPorEstado dados={pibEstado.dados} />

        {/* SEÇÃO: Painel do Consumidor */}
        <SectionTitle>Painel do Consumidor</SectionTitle>
        <PainelConsumidor painel={consumidorPainel} />

        {/* SEÇÃO: Franchising vs Varejo Geral */}
        <SectionTitle>Franchising vs Varejo Geral</SectionTitle>
        <FranchisingVsVarejo pmcDados={pmcData.dados} segmentosABF={segmentos} />

        {/* SEÇÃO: Emprego Formal — Franchising vs Economia */}
        <SectionTitle>Emprego Formal — Franchising vs Economia</SectionTitle>
        <EmpregoFormal
          cagedComercio={cagedComercio.dados}
          cagedServicos={cagedServicos.dados}
          empregosAbf={emprego?.empregos_diretos ?? null}
        />

        <p className="text-center mt-8" style={{ fontSize: 11, color: "#ccc" }}>
          Fonte: ABF · BCB · IBGE/PMC · CAGED · mercadofranquia.com.br/inteligencia
        </p>
      </div>
    </main>
  )
}
