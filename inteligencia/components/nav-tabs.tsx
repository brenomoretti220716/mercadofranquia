"use client"

import { useState } from "react"
import { TabVisaoGeral } from "@/components/tabs/tab-visao-geral"
import { TabSegmentos } from "@/components/tabs/tab-segmentos"
import { TabCenario } from "@/components/tabs/tab-cenario"
import { TabRanking } from "@/components/tabs/tab-ranking"
import { TabProjecoes } from "@/components/tabs/tab-projecoes"

const TABS = [
  { id: "visao-geral", label: "Visao Geral" },
  { id: "segmentos", label: "Segmentos" },
  { id: "cenario", label: "Cenario Economico" },
  { id: "ranking", label: "Ranking de Marcas" },
  { id: "projecoes", label: "Projecoes" },
] as const

type TabId = (typeof TABS)[number]["id"]

export interface AllData {
  kpis: { label: string; valor: string; sub: string; cor: string }[]
  serieAnual: { periodo: string; valor_bi: number }[]
  segmentos: any[]
  segmentosAnual: any[]
  projecoes: any[]
  ranking: any[]
  serieEmpregos: { ano: string; empregos: number; empregos_mi: number }[]
  indicadores: any[]
  anual: any[]
  selic: any
  ipca: any
  dolar: any
  desemprego: any
  pibTrimestral: any
  pibEstado: any
  pmcData: any
  cagedComercio: any
  cagedServicos: any
  consumidorPainel: any
  empregosAbf: number | null
}

export default function NavTabs({ data }: { data: AllData }) {
  const [activeTab, setActiveTab] = useState<TabId>("visao-geral")

  return (
    <>
      <div
        className="flex gap-0 overflow-x-auto mb-6"
        style={{ borderBottom: "1px solid #E5E5E5" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all shrink-0"
            style={{
              color: activeTab === tab.id ? "#E8421A" : "#999",
              borderBottom: activeTab === tab.id ? "2px solid #E8421A" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "visao-geral" && (
        <TabVisaoGeral
          kpis={data.kpis}
          serieAnual={data.serieAnual}
          segmentos={data.segmentos}
          serieEmpregos={data.serieEmpregos}
          indicadores={data.indicadores}
          anual={data.anual}
          pibTrimestral={data.pibTrimestral}
          pibEstado={data.pibEstado}
        />
      )}
      {activeTab === "segmentos" && (
        <TabSegmentos
          segmentos={data.segmentos}
          segmentosAnual={data.segmentosAnual}
          pmcData={data.pmcData}
        />
      )}
      {activeTab === "cenario" && (
        <TabCenario
          selic={data.selic}
          ipca={data.ipca}
          dolar={data.dolar}
          desemprego={data.desemprego}
          consumidorPainel={data.consumidorPainel}
          cagedComercio={data.cagedComercio}
          cagedServicos={data.cagedServicos}
          empregosAbf={data.empregosAbf}
        />
      )}
      {activeTab === "ranking" && (
        <TabRanking ranking={data.ranking} segmentos={data.segmentos} />
      )}
      {activeTab === "projecoes" && (
        <TabProjecoes projecoes={data.projecoes} />
      )}
    </>
  )
}
