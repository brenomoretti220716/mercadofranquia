"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }

interface SyncLog {
  fonte: string
  status: string
  registros_inseridos: number
  erro: string | null
  created_at: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFonte, setFiltroFonte] = useState<string>("")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/sync/status`)
      if (res.ok) setLogs(await res.json())
    } catch {
      // API offline
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const fontes = [...new Set(logs.map((l) => l.fonte))].sort()
  const temErro = logs.some((l) => l.status === "erro")

  const filtered = logs.filter((l) => {
    if (filtroFonte && l.fonte !== filtroFonte) return false
    if (filtroStatus === "ok" && l.status !== "ok") return false
    if (filtroStatus === "erro" && l.status !== "erro") return false
    return true
  })

  function exportCSV() {
    const header = "Fonte,Status,Registros,Erro,Data\n"
    const rows = filtered.map((l) =>
      `"${l.fonte}","${l.status}",${l.registros_inseridos},"${l.erro || ""}","${l.created_at}"`
    ).join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sync-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Logs de Sync</h1>
          {temErro && (
            <span className="text-[10px] font-medium rounded-full px-2.5 py-0.5" style={{ background: "#FCEBEB", color: "#A32D2D" }}>
              Erros recentes
            </span>
          )}
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ border: "1px solid #e0dfda", color: "#888" }}
        >
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "#aaa" }}>Fonte:</span>
          <select
            value={filtroFonte}
            onChange={(e) => setFiltroFonte(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg outline-none"
            style={{ border: "1px solid #e0dfda", color: "#1a1a18", background: "#fff" }}
          >
            <option value="">Todas</option>
            {fontes.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "#aaa" }}>Status:</span>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "#eae9e4" }}>
            {[
              { id: "todos", label: "Todos" },
              { id: "ok", label: "OK" },
              { id: "erro", label: "ERRO" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setFiltroStatus(s.id)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background: filtroStatus === s.id ? "#fff" : "transparent",
                  color: filtroStatus === s.id ? "#1a1a18" : "#888",
                  boxShadow: filtroStatus === s.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
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
          ) : filtered.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#bbb" }}>Nenhum log encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#eee] hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Fonte</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-center">Status</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Registros</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Erro</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l, i) => (
                  <TableRow key={`${l.fonte}-${i}`} className="border-b border-[#f5f5f2] hover:bg-transparent">
                    <TableCell className="font-medium" style={{ color: "#1a1a18" }}>{l.fonte}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className="inline-block text-[10px] font-medium rounded-full px-2.5 py-0.5"
                        style={{
                          background: l.status === "ok" ? "#E1F5EE" : "#FCEBEB",
                          color: l.status === "ok" ? "#0F6E56" : "#A32D2D",
                        }}
                      >
                        {l.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" style={{ color: "#888" }}>
                      {l.registros_inseridos.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell style={{ color: "#E24B4A", fontSize: 12, maxWidth: 300 }}>
                      {l.erro ? <span className="truncate block">{l.erro}</span> : <span style={{ color: "#ccc" }}>—</span>}
                    </TableCell>
                    <TableCell style={{ color: "#888", fontSize: 12 }}>
                      {l.created_at ? new Date(l.created_at).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
