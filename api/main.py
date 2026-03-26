from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sqlite3, json, os, tempfile, re
from database import get_conn, init_db, seed_historico, DB_PATH

app = FastAPI(title="ABF Franquias Intelligence API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    if not os.path.exists(DB_PATH):
        init_db()
        seed_historico()

# ── CONSULTAS ─────────────────────────────────────────────────────────────

@app.get("/api/faturamento/anual")
def get_faturamento_anual():
    conn = get_conn()
    rows = conn.execute("""
        SELECT periodo, segmento, valor_mm, tipo_dado
        FROM faturamento
        WHERE tipo_dado = 'anual'
        ORDER BY periodo, segmento
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/faturamento/segmentos")
def get_segmentos(tipo: str = "anual"):
    conn = get_conn()
    rows = conn.execute("""
        SELECT periodo, segmento, valor_mm
        FROM faturamento
        WHERE tipo_dado = ? AND segmento != 'Total'
        ORDER BY periodo, valor_mm DESC
    """, (tipo,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/indicadores")
def get_indicadores():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM indicadores ORDER BY periodo").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/ranking")
def get_ranking(ano: int = None):
    conn = get_conn()
    q = "SELECT * FROM ranking"
    params = []
    if ano:
        q += " WHERE ano = ?"
        params.append(ano)
    q += " ORDER BY ano, posicao"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/projecoes")
def get_projecoes():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM projecoes ORDER BY ano_referencia").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/relatorios")
def get_relatorios():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM relatorios ORDER BY ano DESC, trimestre DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ── BACKOFFICE: EXTRAÇÃO IA ───────────────────────────────────────────────

@app.post("/api/backoffice/extrair")
async def extrair_pdf(file: UploadFile = File(...)):
    """Recebe PDF, usa Claude API para extrair dados estruturados."""
    import pdfplumber, requests

    # Salvar PDF temporariamente
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # Extrair texto do PDF
    texto = ""
    try:
        with pdfplumber.open(tmp_path) as p:
            for page in p.pages[:8]:
                t = page.extract_text()
                if t:
                    texto += t + "\n"
    finally:
        os.unlink(tmp_path)

    if not texto.strip():
        raise HTTPException(400, "Não foi possível extrair texto do PDF.")

    # Chamar Claude API para estruturar os dados
    prompt = f"""Você é um extrator de dados de relatórios da ABF (Associação Brasileira de Franchising).

Analise o texto abaixo e extraia os dados em JSON estruturado.

Retorne APENAS um JSON válido, sem markdown, sem explicações, com esta estrutura:
{{
  "periodo": "3T2025",
  "ano": 2025,
  "trimestre": 3,
  "faturamento_total_trimestral_mm": null,
  "faturamento_total_anual_mm": null,
  "faturamento_12m_mm": null,
  "var_fat_trimestral_pct": null,
  "var_fat_anual_pct": null,
  "var_fat_12m_pct": null,
  "empregos_diretos": null,
  "var_empregos_pct": null,
  "num_redes": null,
  "num_unidades": null,
  "ticket_medio": null,
  "pib_realizado": null,
  "pib_expectativa": null,
  "ipca_realizado": null,
  "ipca_expectativa": null,
  "selic": null,
  "segmentos_trimestral": [
    {{"segmento": "nome", "valor_mm": 0.0, "var_pct": 0.0}}
  ],
  "segmentos_anual": [],
  "segmentos_12m": [],
  "projecao_proxano_fat_min": null,
  "projecao_proxano_fat_max": null
}}

Valores monetários em R$ MILHÕES (ex: R$ 76,6 bilhões = 76600).
Se um campo não estiver no texto, use null.

TEXTO DO RELATÓRIO:
{texto[:6000]}"""

    try:
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={"Content-Type": "application/json"},
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 2000,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=60
        )
        result = resp.json()
        raw = result["content"][0]["text"]
        # Limpar possível markdown
        raw = re.sub(r"```json|```", "", raw).strip()
        dados = json.loads(raw)
        return {"status": "ok", "dados": dados, "texto_preview": texto[:500]}
    except Exception as e:
        return {"status": "erro", "mensagem": str(e), "texto_preview": texto[:500]}


@app.post("/api/backoffice/salvar")
async def salvar_relatorio(payload: dict):
    """Salva dados revisados no banco."""
    d = payload
    conn = get_conn()
    c = conn.cursor()

    periodo = d.get("periodo")
    if not periodo:
        raise HTTPException(400, "Campo 'periodo' obrigatório.")

    # Upsert relatório
    c.execute("""
        INSERT INTO relatorios(periodo, ano, trimestre, status)
        VALUES(?,?,?,'revisado')
        ON CONFLICT(periodo) DO UPDATE SET
            ano=excluded.ano, trimestre=excluded.trimestre,
            status='revisado', updated_at=datetime('now')
    """, (periodo, d.get("ano"), d.get("trimestre")))

    rel_id = c.execute("SELECT id FROM relatorios WHERE periodo=?", (periodo,)).fetchone()[0]

    # Faturamento total trimestral
    if d.get("faturamento_total_trimestral_mm"):
        c.execute("""INSERT INTO faturamento(relatorio_id,periodo,segmento,valor_mm,tipo_dado)
            VALUES(?,?,'Total',?,'trimestral')
            ON CONFLICT(periodo,segmento,tipo_dado) DO UPDATE SET valor_mm=excluded.valor_mm""",
            (rel_id, periodo, d["faturamento_total_trimestral_mm"]))

    # Faturamento 12m
    if d.get("faturamento_12m_mm"):
        c.execute("""INSERT INTO faturamento(relatorio_id,periodo,segmento,valor_mm,tipo_dado)
            VALUES(?,?,'Total',?,'12m_acumulado')
            ON CONFLICT(periodo,segmento,tipo_dado) DO UPDATE SET valor_mm=excluded.valor_mm""",
            (rel_id, periodo, d["faturamento_12m_mm"]))

    # Segmentos
    for tipo, key in [("trimestral","segmentos_trimestral"),
                       ("anual","segmentos_anual"),
                       ("12m_acumulado","segmentos_12m")]:
        for seg in (d.get(key) or []):
            if seg.get("segmento") and seg.get("valor_mm"):
                c.execute("""INSERT INTO faturamento(relatorio_id,periodo,segmento,valor_mm,tipo_dado)
                    VALUES(?,?,?,?,?)
                    ON CONFLICT(periodo,segmento,tipo_dado) DO UPDATE SET valor_mm=excluded.valor_mm""",
                    (rel_id, periodo, seg["segmento"], seg["valor_mm"], tipo))

    # Indicadores
    c.execute("""
        INSERT INTO indicadores(relatorio_id,periodo,empregos_diretos,var_empregos_pct,
            num_redes,num_unidades,ticket_medio)
        VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(periodo) DO UPDATE SET
            empregos_diretos=COALESCE(excluded.empregos_diretos,empregos_diretos),
            var_empregos_pct=COALESCE(excluded.var_empregos_pct,var_empregos_pct),
            num_redes=COALESCE(excluded.num_redes,num_redes),
            num_unidades=COALESCE(excluded.num_unidades,num_unidades),
            ticket_medio=COALESCE(excluded.ticket_medio,ticket_medio)
    """, (rel_id, periodo, d.get("empregos_diretos"), d.get("var_empregos_pct"),
          d.get("num_redes"), d.get("num_unidades"), d.get("ticket_medio")))

    conn.commit()
    conn.close()
    return {"status": "ok", "periodo": periodo, "relatorio_id": rel_id}


# ── MACRO: BCB E IBGE ─────────────────────────────────────────────────────

SERIES_BCB_MAP = {
    "selic": 11,
    "ipca": 433,
    "dolar": 1,
    "usd": 1,
    "pib": 4380,
    "desemprego": 24369,
}

@app.get("/api/macro/bcb")
def get_macro_bcb(serie: str = "selic", anos: int = 5):
    """Retorna série histórica do BCB. Séries: selic, ipca, dolar, pib, desemprego."""
    codigo = SERIES_BCB_MAP.get(serie.lower())
    if not codigo:
        raise HTTPException(400, f"Série '{serie}' não encontrada. Opções: {', '.join(SERIES_BCB_MAP.keys())}")

    data_limite = f"{2026 - anos}-01-01"
    conn = get_conn()
    rows = conn.execute(
        """SELECT data, nome_serie, valor FROM macro_bcb
           WHERE codigo_serie = ? AND data >= ?
           ORDER BY data""",
        (codigo, data_limite),
    ).fetchall()
    conn.close()
    return {"serie": serie, "codigo": codigo, "registros": len(rows), "dados": [dict(r) for r in rows]}


@app.get("/api/macro/ibge")
def get_macro_ibge(indicador: str = "pib_estado"):
    """Retorna dados do IBGE. Indicadores: pib_estado, varejo."""
    indicadores_map = {
        "pib_estado": 5938,
        "varejo": 8881,
    }
    codigo = indicadores_map.get(indicador.lower())
    if not codigo:
        raise HTTPException(400, f"Indicador '{indicador}' não encontrado. Opções: {', '.join(indicadores_map.keys())}")

    conn = get_conn()
    rows = conn.execute(
        """SELECT data, variavel, localidade, valor FROM macro_ibge
           WHERE codigo_agregado = ?
           ORDER BY data, localidade""",
        (codigo,),
    ).fetchall()
    conn.close()
    return {"indicador": indicador, "codigo": codigo, "registros": len(rows), "dados": [dict(r) for r in rows]}


# ── VAREJO: PMC ──────────────────────────────────────────────────────────

@app.get("/api/varejo/pmc")
def get_varejo_pmc(segmento: str = None, meses: int = 24):
    """Dados da PMC/IBGE por segmento de varejo."""
    from datetime import datetime, timedelta
    data_limite = (datetime.now() - timedelta(days=meses * 30)).strftime("%Y-%m")

    conn = get_conn()

    # Segmentos disponíveis
    segs = conn.execute(
        "SELECT DISTINCT codigo_segmento, nome_segmento FROM pmc_ibge ORDER BY nome_segmento"
    ).fetchall()

    q = "SELECT * FROM pmc_ibge WHERE data >= ?"
    params = [data_limite]
    if segmento:
        q += " AND codigo_segmento = ?"
        params.append(segmento)
    q += " ORDER BY data, nome_segmento"

    rows = conn.execute(q, params).fetchall()
    conn.close()

    return {
        "fonte": "IBGE/PMC",
        "tabela": 8882,
        "registros": len(rows),
        "segmentos_disponiveis": [{"codigo": s["codigo_segmento"], "nome": s["nome_segmento"]} for s in segs],
        "dados": [dict(r) for r in rows],
    }


# ── EMPREGO: CAGED ──────────────────────────────────────────────────────

SETORES_CAGED_MAP = {
    "total": "Total",
    "comercio": "Comércio",
    "servicos": "Serviços",
    "alojamento": "Alojamento e alimentação",
    "construcao": "Construção",
    "industria": "Indústria de transformação",
}

@app.get("/api/emprego/caged")
def get_emprego_caged(setor: str = None, meses: int = 24):
    """Dados de emprego formal (CAGED) por setor via BCB."""
    from datetime import datetime, timedelta
    data_limite = (datetime.now() - timedelta(days=meses * 30)).strftime("%Y-%m-%d")

    conn = get_conn()

    q = "SELECT * FROM caged_bcb WHERE data >= ?"
    params = [data_limite]

    if setor:
        nome_setor = SETORES_CAGED_MAP.get(setor.lower())
        if not nome_setor:
            conn.close()
            raise HTTPException(
                400,
                f"Setor '{setor}' não encontrado. Opções: {', '.join(SETORES_CAGED_MAP.keys())}",
            )
        q += " AND setor = ?"
        params.append(nome_setor)

    q += " ORDER BY data, setor"
    rows = conn.execute(q, params).fetchall()
    conn.close()

    return {
        "fonte": "MTE/CAGED via BCB",
        "registros": len(rows),
        "setores_disponiveis": list(SETORES_CAGED_MAP.keys()),
        "dados": [dict(r) for r in rows],
    }


@app.get("/api/sync/status")
def get_sync_status():
    """Retorna o último sync de cada fonte."""
    conn = get_conn()
    rows = conn.execute(
        """SELECT fonte, status, registros_inseridos, erro, created_at
           FROM sync_log
           WHERE id IN (SELECT MAX(id) FROM sync_log GROUP BY fonte)
           ORDER BY created_at DESC""",
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/")
def root():
    return {"status": "ok", "api": "ABF Franquias Intelligence", "docs": "/docs"}
