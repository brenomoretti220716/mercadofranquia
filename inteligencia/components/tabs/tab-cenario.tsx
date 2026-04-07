"use client"

import { useState, useMemo } from "react"
import { CenarioMacro } from "@/components/macro-charts"
import { PainelConsumidor } from "@/components/consumidor-charts"
import { EmpregoFormal } from "@/components/comparativo-charts"
import { InsightBox, h } from "@/components/insight-box"

function SectionTitle({ children, open, onClick }: { children: React.ReactNode; open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 mt-8 mb-4 w-full text-left group">
      <span className="text-[11px] font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: "#1A1A1A" }}>
        {open ? "\u25BC" : "\u25B6"} {children}
      </span>
      <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
    </button>
  )
}

interface Props {
  selic: any
  ipca: any
  dolar: any
  desemprego: any
  consumidorPainel: any
  cagedComercio: any
  cagedServicos: any
  cagedAlojamento: any
  cagedTotal: any
  empregosAbf: number | null
  indicadores: any[]
}

export function TabCenario({ selic, ipca, dolar, desemprego, consumidorPainel, cagedComercio, cagedServicos, cagedAlojamento, cagedTotal, empregosAbf, indicadores }: Props) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["confianca", "juros", "emprego"]))

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Insights calculados dos dados ──────────────────────────────────
  const confiancaInsights = useMemo(() => {
    const insights: string[] = []
    const iccDados = consumidorPainel?.icc?.dados || []
    const iceDados = consumidorPainel?.ice?.dados || []
    if (iccDados.length > 0) {
      const iccAtual = iccDados[iccDados.length - 1]?.valor
      if (iccAtual > 110) insights.push(`Confianca do consumidor em ${h(iccAtual.toFixed(1))} — nivel favoravel para expansao de franquias`)
      else if (iccAtual < 90) insights.push(`Confianca do consumidor em ${h(iccAtual.toFixed(1))} — momento de cautela, consumidor retraido`)
      else insights.push(`Confianca do consumidor em ${h(iccAtual.toFixed(1))} — nivel neutro`)

      if (iceDados.length > 0) {
        const iceAtual = iceDados[iceDados.length - 1]?.valor
        const diff = +(iceAtual - iccAtual).toFixed(1)
        insights.push(`ICE ${diff > 0 ? h("+" + diff) : h(String(diff))} pontos ${diff > 0 ? "acima" : "abaixo"} do ICC — empresarios ${diff > 0 ? "mais" : "menos"} otimistas que consumidores`)
      }
    }
    const endivDados = consumidorPainel?.endividamento?.dados || []
    if (endivDados.length > 0) {
      const endivAtual = endivDados[endivDados.length - 1]?.valor
      insights.push(`${h(endivAtual.toFixed(1) + "%")} da renda das familias comprometida com dividas — impacto direto na capacidade de investir em franquias`)
    }
    return insights
  }, [consumidorPainel])

  const jurosInsights = useMemo(() => {
    const insights: string[] = []
    const selicDados = selic?.dados || []
    const ipcaDados = ipca?.dados || []
    if (selicDados.length > 0) {
      const selicDiaria = selicDados[selicDados.length - 1]?.valor
      const selicAnual = ((1 + selicDiaria / 100) ** 252 - 1) * 100
      insights.push(`Selic em ${h(selicAnual.toFixed(2) + "% a.a.")} — ${selicAnual > 10 ? "encarece o credito para novos franqueados" : "ambiente de credito favoravel"}`)
    }
    if (ipcaDados.length >= 12) {
      const ultimos12 = ipcaDados.slice(-12)
      const ipca12m = ultimos12.reduce((acc: number, d: any) => acc * (1 + d.valor / 100), 1)
      const ipca12mPct = +((ipca12m - 1) * 100).toFixed(2)
      insights.push(`IPCA de ${h(ipca12mPct + "%")} nos ultimos 12 meses — ${ipca12mPct > 4.5 ? "acima" : ipca12mPct < 3 ? "abaixo" : "dentro"} da meta de 3%`)
    }
    return insights
  }, [selic, ipca])

  const empregoInsights = useMemo(() => {
    const insights: string[] = []
    const comercioDados = cagedComercio?.dados || []
    const servicosDados = cagedServicos?.dados || []
    const alojDados = cagedAlojamento?.dados || []
    const saldoComercio12m = comercioDados.slice(-12).reduce((acc: number, d: any) => acc + (d.saldo || 0), 0)
    const saldoServicos12m = servicosDados.slice(-12).reduce((acc: number, d: any) => acc + (d.saldo || 0), 0)
    const saldoAloj12m = alojDados.slice(-12).reduce((acc: number, d: any) => acc + (d.saldo || 0), 0)
    const saldoTotal = saldoComercio12m + saldoServicos12m + saldoAloj12m
    if (saldoTotal !== 0) {
      insights.push(`Comercio, servicos e alojamento geraram ${h(Math.round(saldoTotal / 1000) + " mil")} vagas nos ultimos 12 meses`)
    }
    if (saldoAloj12m !== 0) {
      insights.push(`Alojamento e alimentacao (setor das franquias de food) gerou ${h(Math.round(saldoAloj12m / 1000) + " mil")} vagas — setor mais diretamente ligado a franquias`)
    }
    if (empregosAbf) {
      const estoqueComercio = comercioDados.length > 0 ? comercioDados[comercioDados.length - 1]?.estoque || 0 : 0
      const estoqueServicos = servicosDados.length > 0 ? servicosDados[servicosDados.length - 1]?.estoque || 0 : 0
      const estoqueAloj = alojDados.length > 0 ? alojDados[alojDados.length - 1]?.estoque || 0 : 0
      const estoqueTotal = estoqueComercio + estoqueServicos + estoqueAloj
      if (estoqueTotal > 0) {
        const pct = +((empregosAbf / estoqueTotal) * 100).toFixed(1)
        insights.push(`Franchising emprega ${h(pct + "%")} do total de comercio + servicos + alojamento`)
      }
    }
    return insights
  }, [cagedComercio, cagedServicos, cagedAlojamento, empregosAbf])

  return (
    <>
      <SectionTitle open={openSections.has("confianca")} onClick={() => toggle("confianca")}>
        Confianca e Consumo
      </SectionTitle>
      {openSections.has("confianca") && (
        <>
          {confiancaInsights.length > 0 && <InsightBox insights={confiancaInsights} />}
          <PainelConsumidor painel={consumidorPainel} />
        </>
      )}

      <SectionTitle open={openSections.has("juros")} onClick={() => toggle("juros")}>
        Juros, Inflacao e Cambio
      </SectionTitle>
      {openSections.has("juros") && (
        <>
          {jurosInsights.length > 0 && <InsightBox insights={jurosInsights} />}
          <CenarioMacro selic={selic} ipca={ipca} dolar={dolar} desemprego={desemprego} />
        </>
      )}

      <SectionTitle open={openSections.has("emprego")} onClick={() => toggle("emprego")}>
        Emprego Formal
      </SectionTitle>
      {openSections.has("emprego") && (
        <>
          {empregoInsights.length > 0 && <InsightBox insights={empregoInsights} />}
          <EmpregoFormal
            cagedComercio={cagedComercio?.dados || []}
            cagedServicos={cagedServicos?.dados || []}
            empregosAbf={empregosAbf}
          />
        </>
      )}
    </>
  )
}
