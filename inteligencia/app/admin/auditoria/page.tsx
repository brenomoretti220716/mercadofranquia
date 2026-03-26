"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }

const ACAO_BADGE: Record<string, { bg: string; color: string }> = {
  INSERT: { bg: "#E1F5EE", color: "#0F6E56" },
  UPDATE: { bg: "#E6F1FB", color: "#185FA5" },
  DELETE: { bg: "#FCEBEB", color: "#A32D2D" },
}

interface AuditLog {
  id: number
  acao: string
  usuario: string
  tabela: string
  registro_id: number | null
  dados_json: string | null
  created_at: string
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAcao, setFiltroAcao] = useState<string>("todos")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroAcao !== "todos") params.set("acao", filtroAcao)
      const res = await fetch(`${API_URL}/api/audit?${params}`)
      if (res.ok) setLogs(await res.json())
    } catch {
      // API offline
    }
    setLoading(false)
  }, [filtroAcao])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Auditoria</h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>Historico de acoes no backoffice</p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "#aaa" }}>Acao:</span>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#eae9e4" }}>
            {[
              { id: "todos", label: "Todas" },
              { id: "INSERT", label: "INSERT" },
              { id: "UPDATE", label: "UPDATE" },
              { id: "DELETE", label: "DELETE" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFiltroAcao(s.id)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: filtroAcao === s.id ? "#fff" : "transparent",
                  color: filtroAcao === s.id ? "#1a1a18" : "#888",
                  boxShadow: filtroAcao === s.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center py-8" style={{ color: "#bbb" }}>Carregando...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#bbb" }}>Nenhuma acao registrada</p>
          ) : (
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#eee] hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-center">Acao</TableHead>
                    <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Usuario</TableHead>
                    <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Tabela</TableHead>
                    <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Detalhes</TableHead>
                    <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => {
                    const badge = ACAO_BADGE[l.acao] || ACAO_BADGE.UPDATE
                    let detalhes = ""
                    if (l.dados_json) {
                      try {
                        const d = JSON.parse(l.dados_json)
                        detalhes = d.periodo || d.descricao || JSON.stringify(d).slice(0, 80)
                      } catch {
                        detalhes = l.dados_json.slice(0, 80)
                      }
                    }

                    return (
                      <TableRow key={l.id} className="border-b border-[#f5f5f2] hover:bg-transparent">
                        <TableCell className="text-center">
                          <span
                            className="inline-block text-[10px] font-medium rounded-full px-2.5 py-0.5"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {l.acao}
                          </span>
                        </TableCell>
                        <TableCell style={{ color: "#888", fontSize: 12 }}>{l.usuario}</TableCell>
                        <TableCell className="font-medium" style={{ color: "#1a1a18", fontSize: 12 }}>{l.tabela}</TableCell>
                        <TableCell style={{ color: "#888", fontSize: 12, maxWidth: 250 }}>
                          <span className="truncate block">{detalhes || "—"}</span>
                        </TableCell>
                        <TableCell style={{ color: "#888", fontSize: 12 }}>
                          {l.created_at ? new Date(l.created_at).toLocaleString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
