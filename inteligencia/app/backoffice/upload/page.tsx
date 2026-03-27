"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const CARD_STYLE = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }
const COR_PRIMARIA = "#1D9E75"

const SEGMENTOS_DEFAULT = [
  "Alimentação", "Casa e Construção", "Comunicação, Informática e Eletrônicos",
  "Entretenimento e Lazer", "Hotelaria e Turismo", "Limpeza e Conservação",
  "Moda", "Saúde, Beleza", "Serviços Automotivos",
  "Serviços e Outros Negócios", "Serviços Educacionais", "Logística e Transporte",
]

type Status = "aguardando" | "extraindo" | "revisao" | "salvo"

const STATUS_LABELS: Record<Status, { label: string; color: string }> = {
  aguardando: { label: "Aguardando PDF", color: "#888" },
  extraindo: { label: "Extraindo com IA...", color: "#B8860B" },
  revisao: { label: "Revisao dos dados", color: "#185FA5" },
  salvo: { label: "Salvo ✓", color: "#0F6E56" },
}

interface DadosExtraidos {
  periodo: string
  ano: number | null
  trimestre: number | null
  faturamento_total_trimestral_mm: number | null
  faturamento_12m_mm: number | null
  empregos_diretos: number | null
  pib_realizado: number | null
  ipca_realizado: number | null
  segmentos_trimestral: { segmento: string; valor_mm: number | null }[]
}

function emptyDados(): DadosExtraidos {
  return {
    periodo: "",
    ano: null,
    trimestre: null,
    faturamento_total_trimestral_mm: null,
    faturamento_12m_mm: null,
    empregos_diretos: null,
    pib_realizado: null,
    ipca_realizado: null,
    segmentos_trimestral: SEGMENTOS_DEFAULT.map((s) => ({ segmento: s, valor_mm: null })),
  }
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>("aguardando")
  const [dados, setDados] = useState<DadosExtraidos>(emptyDados())
  const [erro, setErro] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(f: File | undefined) {
    if (!f || !f.name.endsWith(".pdf")) return
    setFile(f)
    setStatus("aguardando")
    setErro("")
  }

  async function extrair() {
    if (!file) return
    setStatus("extraindo")
    setErro("")

    const form = new FormData()
    form.append("file", file)

    try {
      const res = await fetch(`${API_URL}/api/backoffice/extrair`, { method: "POST", body: form })
      const json = await res.json()

      if (json.status === "ok" && json.dados) {
        const d = json.dados
        setDados({
          periodo: d.periodo || "",
          ano: d.ano || null,
          trimestre: d.trimestre || null,
          faturamento_total_trimestral_mm: d.faturamento_total_trimestral_mm || null,
          faturamento_12m_mm: d.faturamento_12m_mm || null,
          empregos_diretos: d.empregos_diretos || null,
          pib_realizado: d.pib_realizado || null,
          ipca_realizado: d.ipca_realizado || null,
          segmentos_trimestral: d.segmentos_trimestral?.length
            ? d.segmentos_trimestral
            : SEGMENTOS_DEFAULT.map((s) => ({ segmento: s, valor_mm: null })),
        })
        setStatus("revisao")
      } else {
        setErro(json.mensagem || "Erro na extracao")
        setStatus("aguardando")
      }
    } catch {
      setErro("Erro de conexao com a API")
      setStatus("aguardando")
    }
  }

  async function salvar() {
    try {
      const res = await fetch(`${API_URL}/api/backoffice/salvar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      })
      const json = await res.json()
      if (json.status === "ok") {
        setStatus("salvo")
      } else {
        setErro("Erro ao salvar")
      }
    } catch {
      setErro("Erro de conexao")
    }
  }

  function updateField(field: keyof DadosExtraidos, value: string) {
    setDados((prev) => ({
      ...prev,
      [field]: value === "" ? null : isNaN(Number(value)) ? value : Number(value),
    }))
  }

  function updateSegmento(idx: number, value: string) {
    setDados((prev) => {
      const segs = [...prev.segmentos_trimestral]
      segs[idx] = { ...segs[idx], valor_mm: value === "" ? null : Number(value) }
      return { ...prev, segmentos_trimestral: segs }
    })
  }

  const statusInfo = STATUS_LABELS[status]

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-medium" style={{ color: "#1a1a18" }}>Upload PDF</h1>
        <p className="text-sm mt-1" style={{ color: "#888" }}>Extraia dados de relatorios ABF com inteligencia artificial</p>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 mb-6">
        {(["aguardando", "extraindo", "revisao", "salvo"] as Status[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="rounded-full flex items-center justify-center text-xs font-medium"
              style={{
                width: 24, height: 24,
                background: status === s || (["aguardando", "extraindo", "revisao", "salvo"].indexOf(status) > i) ? COR_PRIMARIA : "#e0dfda",
                color: status === s || (["aguardando", "extraindo", "revisao", "salvo"].indexOf(status) > i) ? "#fff" : "#888",
              }}
            >
              {i + 1}
            </div>
            <span className="text-xs" style={{ color: status === s ? "#1a1a18" : "#888" }}>
              {STATUS_LABELS[s].label}
            </span>
            {i < 3 && <div className="w-8 h-px" style={{ background: "#e0dfda" }} />}
          </div>
        ))}
      </div>

      {/* Drop zone */}
      {status !== "salvo" && (
        <Card className="border-0 shadow-none mb-5" style={CARD_STYLE}>
          <CardContent className="p-6">
            <div
              className="rounded-xl p-8 text-center cursor-pointer transition-all"
              style={{
                border: `2px dashed ${dragOver ? COR_PRIMARIA : "#e0dfda"}`,
                background: dragOver ? "#f0faf6" : "#fafaf8",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              {file ? (
                <div>
                  <div className="text-sm font-medium" style={{ color: "#1a1a18" }}>{file.name}</div>
                  <div className="text-xs mt-1" style={{ color: "#888" }}>{(file.size / 1024).toFixed(0)} KB</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm" style={{ color: "#888" }}>Arraste um PDF aqui ou clique para selecionar</div>
                  <div className="text-xs mt-1" style={{ color: "#bbb" }}>Relatorios trimestrais ABF</div>
                </div>
              )}
            </div>

            {file && status === "aguardando" && (
              <button
                onClick={extrair}
                className="mt-4 px-5 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: COR_PRIMARIA }}
              >
                Extrair com IA
              </button>
            )}

            {status === "extraindo" && (
              <div className="mt-4 flex items-center gap-3">
                <div className="animate-spin rounded-full border-2 border-t-transparent" style={{ width: 20, height: 20, borderColor: `${COR_PRIMARIA} transparent ${COR_PRIMARIA} ${COR_PRIMARIA}` }} />
                <span className="text-sm" style={{ color: "#B8860B" }}>Extraindo dados com Claude AI...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {erro && (
        <div className="mb-5 p-3 rounded-lg text-sm" style={{ background: "#FCEBEB", color: "#A32D2D" }}>
          {erro}
        </div>
      )}

      {/* Formulário de revisão */}
      {(status === "revisao" || status === "salvo") && (
        <>
          <Card className="border-0 shadow-none mb-5" style={CARD_STYLE}>
            <CardContent className="p-6">
              <div className="text-[11px] uppercase tracking-wider font-medium mb-4" style={{ color: "#aaa" }}>
                Dados gerais
              </div>
              <div className="grid grid-cols-3 gap-4">
                {([
                  ["periodo", "Periodo (ex: 3T2025)"],
                  ["ano", "Ano"],
                  ["trimestre", "Trimestre (1-4)"],
                  ["faturamento_total_trimestral_mm", "Fat. trimestral (R$ MM)"],
                  ["faturamento_12m_mm", "Fat. 12 meses (R$ MM)"],
                  ["empregos_diretos", "Empregos diretos"],
                  ["pib_realizado", "PIB realizado (%)"],
                  ["ipca_realizado", "IPCA realizado (%)"],
                ] as [Exclude<keyof DadosExtraidos, "segmentos_trimestral">, string][]).map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs mb-1" style={{ color: "#888" }}>{label}</label>
                    <input
                      type={field === "periodo" ? "text" : "number"}
                      value={dados[field] ?? ""}
                      onChange={(e) => updateField(field, e.target.value)}
                      disabled={status === "salvo"}
                      className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #e0dfda", color: "#1a1a18", background: status === "salvo" ? "#f4f3ef" : "#fff" }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none mb-5" style={CARD_STYLE}>
            <CardContent className="p-6">
              <div className="text-[11px] uppercase tracking-wider font-medium mb-4" style={{ color: "#aaa" }}>
                Segmentos — Faturamento trimestral (R$ MM)
              </div>
              <div className="grid grid-cols-2 gap-3">
                {dados.segmentos_trimestral.map((seg, i) => (
                  <div key={seg.segmento} className="flex items-center gap-3">
                    <span className="text-xs shrink-0 truncate" style={{ color: "#555", width: 200 }}>{seg.segmento}</span>
                    <input
                      type="number"
                      value={seg.valor_mm ?? ""}
                      onChange={(e) => updateSegmento(i, e.target.value)}
                      disabled={status === "salvo"}
                      className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                      style={{ border: "1px solid #e0dfda", color: "#1a1a18", background: status === "salvo" ? "#f4f3ef" : "#fff" }}
                      placeholder="0.0"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {status === "revisao" && (
            <button
              onClick={salvar}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: COR_PRIMARIA }}
            >
              Confirmar e salvar
            </button>
          )}

          {status === "salvo" && (
            <div className="p-4 rounded-xl" style={{ background: "#E1F5EE", border: "1px solid #c3e8d9" }}>
              <div className="text-sm font-medium" style={{ color: "#0F6E56" }}>
                Dados salvos com sucesso — {dados.periodo}
              </div>
              <div className="text-xs mt-1" style={{ color: "#1D9E75" }}>
                <a href="/backoffice/relatorios" className="underline">Ver relatorios</a>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
