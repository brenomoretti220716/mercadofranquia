"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const P = "#E8421A"
const CS = { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }

export default function SistemaPage() {
  const [tab, setTab] = useState<"logs" | "auditoria">("logs")
  const [logs, setLogs] = useState<any[]>([])
  const [audit, setAudit] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, auditRes] = await Promise.all([
        fetch(`${API_URL}/api/sync/status`).then((r) => r.ok ? r.json() : []),
        fetch(`${API_URL}/api/audit`).then((r) => r.ok ? r.json() : []),
      ])
      setLogs(logsRes)
      setAudit(auditRes)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Sistema</h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>Logs de sincronizacao e auditoria de acoes</p>
      </div>

      <div className="flex gap-1.5 mb-6 p-1" style={{ background: "#F0F0F0", borderRadius: 10 }}>
        {[
          { id: "logs" as const, label: `Logs de Sync (${logs.length})` },
          { id: "auditoria" as const, label: `Auditoria (${audit.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all" style={{ background: tab === t.id ? P : "transparent", color: tab === t.id ? "#fff" : "#666", borderRadius: 8 }}>{t.label}</button>
        ))}
      </div>

      {loading ? <p className="text-center py-12" style={{ color: "#bbb" }}>Carregando...</p> : (
        <>
          {tab === "logs" && (
            <Card className="border-0 shadow-none" style={CS}>
              <CardContent className="p-5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#E5E5E5]">
                      <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Status</TableHead>
                      <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Fonte</TableHead>
                      <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold text-right">Registros</TableHead>
                      <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Erro</TableHead>
                      <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((l: any, i: number) => (
                      <TableRow key={i} className="border-b border-[#F5F5F5]">
                        <TableCell>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: l.status === "ok" ? "#E8F5E9" : "#FFEBEE", color: l.status === "ok" ? "#0F6E56" : "#A32D2D" }}>{l.status?.toUpperCase()}</span>
                        </TableCell>
                        <TableCell className="font-medium" style={{ color: "#1A1A1A", fontSize: 12 }}>{l.fonte}</TableCell>
                        <TableCell className="text-right" style={{ color: "#888", fontSize: 12 }}>{l.registros_inseridos}</TableCell>
                        <TableCell style={{ color: "#E24B4A", fontSize: 11, maxWidth: 200 }}>{l.erro ? <span className="truncate block">{l.erro}</span> : <span style={{ color: "#CCC" }}>—</span>}</TableCell>
                        <TableCell style={{ color: "#888", fontSize: 12 }}>{l.created_at ? new Date(l.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {tab === "auditoria" && (
            <Card className="border-0 shadow-none" style={CS}>
              <CardContent className="p-5">
                {audit.length === 0 ? <p className="text-center py-8" style={{ color: "#bbb" }}>Nenhuma acao registrada</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-[#E5E5E5]">
                        <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Acao</TableHead>
                        <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Usuario</TableHead>
                        <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Tabela</TableHead>
                        <TableHead className="text-[11px] uppercase text-[#BBB] font-semibold">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {audit.map((a: any) => (
                        <TableRow key={a.id} className="border-b border-[#F5F5F5]">
                          <TableCell><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: a.acao === "INSERT" ? "#E8F5E9" : a.acao === "DELETE" ? "#FFEBEE" : "#EBF5FF", color: a.acao === "INSERT" ? "#0F6E56" : a.acao === "DELETE" ? "#A32D2D" : "#185FA5" }}>{a.acao}</span></TableCell>
                          <TableCell style={{ color: "#888", fontSize: 12 }}>{a.usuario}</TableCell>
                          <TableCell className="font-medium" style={{ color: "#1A1A1A", fontSize: 12 }}>{a.tabela}</TableCell>
                          <TableCell style={{ color: "#888", fontSize: 12 }}>{a.created_at ? new Date(a.created_at).toLocaleString("pt-BR") : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  )
}
