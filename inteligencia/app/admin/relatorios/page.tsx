"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  importado: { bg: "#FFF8E1", color: "#B8860B" },
  revisado: { bg: "#E6F1FB", color: "#185FA5" },
  publicado: { bg: "#E1F5EE", color: "#0F6E56" },
}

const STATUS_NEXT: Record<string, string> = {
  importado: "revisado",
  revisado: "publicado",
  publicado: "importado",
}

interface Relatorio {
  id: number
  periodo: string
  ano: number
  trimestre: number | null
  status: string
  created_at: string
  updated_at: string
}

export default function RelatoriosPage() {
  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRelatorios = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/relatorios`)
      if (res.ok) setRelatorios(await res.json())
    } catch {
      // API offline
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchRelatorios() }, [fetchRelatorios])

  async function alterarStatus(periodo: string, novoStatus: string) {
    try {
      await fetch(`${API_URL}/api/backoffice/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodo, status: novoStatus }),
      })
      setRelatorios((prev) =>
        prev.map((r) => (r.periodo === periodo ? { ...r, status: novoStatus } : r))
      )
    } catch {
      // silencioso
    }
  }

  async function excluir(periodo: string) {
    if (!confirm(`Excluir relatorio ${periodo}? Esta acao nao pode ser desfeita.`)) return
    try {
      await fetch(`${API_URL}/api/backoffice/excluir/${periodo}`, { method: "DELETE" })
      setRelatorios((prev) => prev.filter((r) => r.periodo !== periodo))
    } catch {
      // silencioso
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Relatorios</h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>Gestao de relatorios ABF importados</p>
        </div>
        <a
          href="/admin/upload"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "#1D9E75" }}
        >
          + Novo relatorio
        </a>
      </div>

      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center py-8" style={{ color: "#bbb" }}>Carregando...</p>
          ) : relatorios.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#bbb" }}>Nenhum relatorio importado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#eee] hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Periodo</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-center">Ano</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-center">Tri</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-center">Status</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium">Data importacao</TableHead>
                  <TableHead className="text-[11px] uppercase text-[#bbb] font-medium text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorios.map((r) => {
                  const badge = STATUS_BADGE[r.status] || STATUS_BADGE.importado
                  return (
                    <TableRow key={r.periodo} className="border-b border-[#f5f5f2] hover:bg-transparent">
                      <TableCell className="font-medium" style={{ color: "#1a1a18" }}>{r.periodo}</TableCell>
                      <TableCell className="text-center" style={{ color: "#888" }}>{r.ano}</TableCell>
                      <TableCell className="text-center" style={{ color: "#888" }}>{r.trimestre ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => alterarStatus(r.periodo, STATUS_NEXT[r.status] || "importado")}
                          className="inline-block text-[11px] font-medium rounded-full px-3 py-0.5 cursor-pointer transition-opacity hover:opacity-80"
                          style={{ background: badge.bg, color: badge.color }}
                          title={`Clique para alterar para "${STATUS_NEXT[r.status]}"`}
                        >
                          {r.status}
                        </button>
                      </TableCell>
                      <TableCell style={{ color: "#888", fontSize: 12 }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => excluir(r.periodo)}
                          className="text-xs font-medium px-2 py-1 rounded transition-colors"
                          style={{ color: "#E24B4A" }}
                        >
                          Excluir
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
