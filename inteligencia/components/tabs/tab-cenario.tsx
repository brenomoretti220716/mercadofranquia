"use client"

import { useState } from "react"
import { CenarioMacro } from "@/components/macro-charts"
import { PainelConsumidor } from "@/components/consumidor-charts"
import { EmpregoFormal } from "@/components/comparativo-charts"

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
  empregosAbf: number | null
}

export function TabCenario({ selic, ipca, dolar, desemprego, consumidorPainel, cagedComercio, cagedServicos, empregosAbf }: Props) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["confianca", "juros", "emprego"]))

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <>
      <SectionTitle open={openSections.has("confianca")} onClick={() => toggle("confianca")}>
        Confianca e Consumo
      </SectionTitle>
      {openSections.has("confianca") && <PainelConsumidor painel={consumidorPainel} />}

      <SectionTitle open={openSections.has("juros")} onClick={() => toggle("juros")}>
        Juros, Inflacao e Cambio
      </SectionTitle>
      {openSections.has("juros") && <CenarioMacro selic={selic} ipca={ipca} dolar={dolar} desemprego={desemprego} />}

      <SectionTitle open={openSections.has("emprego")} onClick={() => toggle("emprego")}>
        Emprego Formal
      </SectionTitle>
      {openSections.has("emprego") && (
        <EmpregoFormal
          cagedComercio={cagedComercio?.dados || []}
          cagedServicos={cagedServicos?.dados || []}
          empregosAbf={empregosAbf}
        />
      )}
    </>
  )
}
