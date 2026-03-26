# API — Mercado Franquia (ABF Intelligence)

API REST em FastAPI que serve dados do mercado de franquias brasileiro, extraídos de relatórios da ABF.

## Como rodar

```bash
# Instalar dependências
pip install -r requirements.txt

# Rodar o servidor
uvicorn main:app --reload --port 8000
```

A documentação interativa fica em: `http://localhost:8000/docs`

## Endpoints

### `GET /`
Status da API.

**Resposta:**
```json
{"status": "ok", "api": "ABF Franquias Intelligence", "docs": "/docs"}
```

---

### `GET /api/faturamento/anual`
Faturamento anual total e por segmento.

**Resposta:**
```json
[
  {"periodo": "2024", "segmento": "Total", "valor_mm": 264727.0, "tipo_dado": "anual"}
]
```

---

### `GET /api/faturamento/segmentos?tipo=anual`
Faturamento por segmento. Parâmetro `tipo`: `anual`, `trimestral`, `12m_acumulado`.

**Resposta:**
```json
[
  {"periodo": "4T2023", "segmento": "Saúde, Beleza e Bem-Estar", "valor_mm": 57470.0}
]
```

---

### `GET /api/indicadores`
Indicadores do setor: empregos, redes, unidades.

**Resposta:**
```json
[
  {"periodo": "4T2024", "empregos_diretos": 1795320, "var_empregos_pct": 9.1, "empregos_por_unidade": 9.0}
]
```

---

### `GET /api/ranking?ano=2023`
Ranking das maiores franquias por número de unidades. Parâmetro `ano` opcional.

**Resposta:**
```json
[
  {"ano": 2023, "posicao": 1, "marca": "Cacau Show", "segmento": "Alimentação", "unidades": 4216, "var_pct": 10.7}
]
```

---

### `GET /api/projecoes`
Projeções de crescimento vs. realizado.

**Resposta:**
```json
[
  {"ano_referencia": 2025, "fat_var_min_pct": 2.0, "fat_var_max_pct": 2.0, "fat_realizado_pct": 10.5}
]
```

---

### `GET /api/relatorios`
Lista todos os relatórios importados.

**Resposta:**
```json
[
  {"id": 1, "periodo": "4T2025", "ano": 2025, "trimestre": 4, "status": "revisado"}
]
```

---

### `POST /api/backoffice/extrair`
Upload de PDF de relatório ABF. Extrai dados via Claude API e retorna JSON estruturado.

**Body:** `multipart/form-data` com campo `file` (PDF).

**Resposta:**
```json
{
  "status": "ok",
  "dados": {"periodo": "3T2025", "faturamento_total_trimestral_mm": 76607, "...": "..."},
  "texto_preview": "..."
}
```

---

### `POST /api/backoffice/salvar`
Salva dados revisados no banco (upsert).

**Body:** JSON com os campos extraídos (mesmo schema do endpoint de extração).

**Resposta:**
```json
{"status": "ok", "periodo": "3T2025", "relatorio_id": 28}
```

---

## Fontes de dados externas

### BCB (Banco Central do Brasil)

Endpoint: `GET /api/macro/bcb?serie=selic&anos=5`

| Série | Código | Descrição |
|---|---|---|
| `selic` | 11 | Taxa Selic |
| `ipca` | 433 | Inflação IPCA |
| `dolar` / `usd` | 1 | Câmbio USD/BRL |
| `pib` | 4380 | PIB trimestral |
| `desemprego` | 24369 | Taxa de desemprego |

**Resposta:**
```json
{
  "serie": "selic",
  "codigo": 11,
  "registros": 120,
  "dados": [{"data": "2021-01-01", "nome_serie": "Selic", "valor": 2.0}]
}
```

### IBGE (Instituto Brasileiro de Geografia e Estatística)

Endpoint: `GET /api/macro/ibge?indicador=pib_estado`

| Indicador | Código | Descrição |
|---|---|---|
| `pib_estado` | 5938 | PIB por estado (variável 37) |
| `varejo` | 8881 | PMC — Pesquisa Mensal de Comércio (variável 11709) |

**Resposta:**
```json
{
  "indicador": "pib_estado",
  "codigo": 5938,
  "registros": 297,
  "dados": [{"data": "2014", "variavel": "PIB...", "localidade": "São Paulo", "valor": 1858196.0}]
}
```

### Status do sync

Endpoint: `GET /api/sync/status`

**Resposta:**
```json
[
  {"fonte": "BCB/Selic (11)", "status": "ok", "registros_inseridos": 2800, "erro": null, "created_at": "2026-03-25 12:00:00"}
]
```

### Sync manual

```bash
cd api && python3 sync.py
```

O sync também roda automaticamente via GitHub Actions toda segunda-feira às 10h UTC.

---

## Banco de dados

SQLite (`abf.db`) com as tabelas:
- `relatorios` — metadata dos relatórios importados
- `faturamento` — valores de faturamento por período/segmento
- `indicadores` — empregos, redes, unidades
- `macro` — dados macroeconômicos (PIB, IPCA, Selic) dos relatórios ABF
- `macro_bcb` — séries históricas do Banco Central (Selic, IPCA, câmbio, PIB, desemprego)
- `macro_ibge` — dados agregados do IBGE (PIB por estado, varejo)
- `ranking` — ranking das maiores franquias
- `projecoes` — projeções de crescimento vs. realizado
- `sync_log` — log de cada execução de sync (fonte, status, quantidade, erro)
