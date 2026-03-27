"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
const COR_PRIMARIA = "#1D9E75"

interface FonteConfig {
  id: string
  nome: string
  tipo: "manual" | "api"
}

const FONTES: FonteConfig[] = [
  { id: "abf", nome: "ABF (Relatorios)", tipo: "manual" },
  { id: "bcb_selic", nome: "BCB / Selic", tipo: "api" },
  { id: "bcb_ipca", nome: "BCB / IPCA", tipo: "api" },
  { id: "bcb_cambio", nome: "BCB / Cambio", tipo: "api" },
  { id: "bcb_pib", nome: "BCB / PIB", tipo: "api" },
  { id: "bcb_desemprego", nome: "BCB / Desemprego", tipo: "api" },
  { id: "bcb_icc", nome: "BCB / ICC", tipo: "api" },
  { id: "bcb_ice", nome: "BCB / ICE", tipo: "api" },
  { id: "bcb_endividamento", nome: "BCB / Endividamento", tipo: "api" },
  { id: "bcb_massa_salarial", nome: "BCB / Massa salarial", tipo: "api" },
  { id: "ibge_pib_estados", nome: "IBGE / PIB estados", tipo: "api" },
  { id: "ibge_pmc", nome: "IBGE / PMC", tipo: "api" },
  { id: "caged", nome: "CAGED", tipo: "api" },
]

interface SyncInfo {
  fonte: string
  status: string
  registros_inseridos: number
  erro: string | null
  created_at: string
}

interface StatsInfo {
  tabela: string
  registros: number
}

export default function FontesPage() {
  const [syncData, setSyncData] = useState<SyncInfo[]>([])
  const [stats, setStats] = useState<StatsInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [syncRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/api/sync/status`).then((r) => r.ok ? r.json() : []),
          fetch(`${API_URL}/api/backoffice/stats`).then((r) => r.ok ? r.json() : []),
        ])
        setSyncData(syncRes)
        setStats(statsRes)
      } catch {
        // API offline
      }
      setLoading(false)
    }
    load()
  }, [])

  async function sincronizar() {
    setSyncing(true)
    try {
      const res = await fetch(`${API_URL}/api/sync/status`)
      if (res.ok) setSyncData(await res.json())
    } catch {
      // silencioso
    }
    setSyncing(false)
  }

  function getSyncInfo(fonteId: string) {
    const normalizado = fonteId.replace(/_/g, " ").toLowerCase()
    return syncData.find((s) => s.fonte.toLowerCase().includes(normalizado.split("_").pop() || ""))
  }

  function getRegistros(fonteId: string) {
    const map: Record<string, string> = {
      abf: "relatorios",
      bcb_selic: "macro_bcb", bcb_ipca: "macro_bcb", bcb_cambio: "macro_bcb",
      bcb_pib: "macro_bcb", bcb_desemprego: "macro_bcb", bcb_icc: "macro_bcb",
      bcb_ice: "macro_bcb", bcb_endividamento: "macro_bcb", bcb_massa_salarial: "macro_bcb",
      ibge_pib_estados: "macro_ibge", ibge_pmc: "pmc_ibge",
      caged: "caged_bcb",
    }
    const tabela = map[fonteId]
    const stat = stats.find((s) => s.tabela === tabela)
    return stat?.registros ?? null
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Fontes de Dados</h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>Status de cada fonte integrada ao sistema</p>
        </div>
        <button
          onClick={sincronizar}
          disabled={syncing}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity"
          style={{ background: COR_PRIMARIA, opacity: syncing ? 0.6 : 1 }}
        >
          {syncing ? "Verificando..." : "Sincronizar tudo"}
        </button>
      </div>

      {loading ? (
        <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {FONTES.map((fonte) => {
            const sync = getSyncInfo(fonte.id)
            const registros = getRegistros(fonte.id)
            const isOk = !sync || sync.status === "ok"
            const lastSync = sync?.created_at ? new Date(sync.created_at).toLocaleDateString("pt-BR") : null

            return (
              <Card key={fonte.id} className="border-0 shadow-none" style={CARD_STYLE}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: "#1a1a18" }}>{fonte.nome}</span>
                    <span
                      className="text-[10px] font-medium rounded-full px-2.5 py-0.5"
                      style={{
                        background: isOk ? "#E1F5EE" : "#FCEBEB",
                        color: isOk ? "#0F6E56" : "#A32D2D",
                      }}
                    >
                      {isOk ? "OK" : "ERRO"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "#bbb" }}>Tipo</span>
                      <span className="text-xs" style={{ color: "#888" }}>{fonte.tipo === "manual" ? "Upload manual" : "API automatica"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "#bbb" }}>Ultimo sync</span>
                      <span className="text-xs" style={{ color: "#888" }}>{lastSync ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "#bbb" }}>Registros</span>
                      <span className="text-xs font-medium" style={{ color: "#1a1a18" }}>
                        {registros != null ? registros.toLocaleString("pt-BR") : "—"}
                      </span>
                    </div>
                    {sync?.erro && (
                      <div className="text-[10px] mt-1 p-2 rounded" style={{ background: "#FCEBEB", color: "#A32D2D" }}>
                        {sync.erro}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
