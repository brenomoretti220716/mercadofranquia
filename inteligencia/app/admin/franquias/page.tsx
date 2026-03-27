"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }

interface Franquia {
  id: number
  nome: string
  segmento: string | null
  investimento_min: number | null
  investimento_max: number | null
  num_unidades: number | null
  fonte: string
}

interface FranquiasResponse {
  total: number
  page: number
  pages: number
  dados: Franquia[]
}

export default function FranquiasPage() {
  const [data, setData] = useState<FranquiasResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/franquias?page=${page}&limit=20`)
        if (res.ok) setData(await res.json())
      } catch {}
      setLoading(false)
    }
    load()
  }, [page])

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Franquias</h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>
          {data ? `${data.total.toLocaleString("pt-BR")} franquias cadastradas` : "Carregando..."}
        </p>
      </div>

      <Card className="border-0 shadow-none" style={CARD_STYLE}>
        <CardContent className="p-6">
          {loading ? (
            <p className="text-center py-8" style={{ color: "#bbb" }}>Carregando...</p>
          ) : !data || data.dados.length === 0 ? (
            <p className="text-center py-8" style={{ color: "#bbb" }}>Nenhuma franquia encontrada</p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {data.dados.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid #f5f5f2" }}>
                    <div>
                      <span className="text-sm font-medium" style={{ color: "#1a1a18" }}>{f.nome}</span>
                      {f.segmento && (
                        <span className="ml-2 text-[10px] font-medium rounded-full px-2 py-0.5" style={{ background: "#E1F5EE", color: "#0F6E56" }}>
                          {f.segmento}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {f.num_unidades && (
                        <span className="text-xs" style={{ color: "#888" }}>{f.num_unidades.toLocaleString("pt-BR")} un</span>
                      )}
                      {f.investimento_min && (
                        <span className="text-xs font-medium" style={{ color: "#1a1a18" }}>
                          R$ {(f.investimento_min / 1000).toFixed(0)}k
                          {f.investimento_max && f.investimento_max !== f.investimento_min && ` - ${(f.investimento_max / 1000).toFixed(0)}k`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs" style={{ color: "#888" }}>
                  Pagina {data.page} de {data.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded text-xs"
                    style={{ border: "1px solid #e0dfda", color: page <= 1 ? "#ccc" : "#888" }}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page >= data.pages}
                    className="px-3 py-1 rounded text-xs"
                    style={{ border: "1px solid #e0dfda", color: page >= data.pages ? "#ccc" : "#888" }}
                  >
                    Proxima
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
