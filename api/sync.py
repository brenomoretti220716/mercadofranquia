"""
Sync automático de dados macroeconômicos do BCB e IBGE.

Uso: python3 api/sync.py
"""

import json, os, ssl, sys
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import URLError

# Configura SSL com certifi se disponível (necessário no macOS)
try:
    import certifi
    SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL_CTX = ssl.create_default_context()

# Garante import relativo quando rodado de qualquer diretório
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from database import get_conn, init_db

# ── Configuração das séries BCB ──────────────────────────────────────────────

SERIES_BCB = {
    11:    "Selic",
    433:   "IPCA",
    1:     "USD/BRL",
    4380:  "PIB trimestral",
    24369: "Desemprego",
    4393:  "ICC",
    4395:  "ICE",
    29039: "Endividamento famílias",
    17633: "Massa salarial real",
}

# Séries diárias (Selic, USD) são muito grandes desde 2014, buscar em chunks
SERIES_DIARIAS = {11, 1}
BCB_CHUNKS = [
    ("01/01/2014", "31/12/2017"),
    ("01/01/2018", "31/12/2021"),
    ("01/01/2022", ""),  # vazio = até hoje
]
BCB_CHUNK_UNICO = [("01/01/2014", "")]  # séries menores cabem numa chamada

# ── Configuração CAGED (emprego formal via BCB SGS) ─────────────────────────

SERIES_CAGED = {
    28763: "Total",
    28771: "Comércio",
    28772: "Serviços",
    28774: "Alojamento e alimentação",
    28770: "Construção",
    28766: "Indústria de transformação",
}

# ── Configuração IBGE ────────────────────────────────────────────────────────

PERIODOS_IBGE = "|".join(str(a) for a in range(2014, 2025))

def _periodos_mensais_ibge(ano_inicio=2014, ano_fim=2025):
    """Gera períodos mensais no formato YYYYMM para a API do IBGE."""
    periodos = []
    for ano in range(ano_inicio, ano_fim + 1):
        for mes in range(1, 13):
            periodos.append(f"{ano}{mes:02d}")
    return "|".join(periodos)


PERIODOS_MENSAIS_IBGE = _periodos_mensais_ibge()

ENDPOINTS_IBGE = [
    {
        "nome": "PIB por estado",
        "codigo_agregado": 5938,
        "variavel": 37,
        "url": f"https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/{PERIODOS_IBGE}/variaveis/37?localidades=N3[all]",
    },
    {
        "nome": "PMC - Varejo",
        "codigo_agregado": 8881,
        "variavel": 11709,
        "url": f"https://servicodados.ibge.gov.br/api/v3/agregados/8881/periodos/{PERIODOS_MENSAIS_IBGE}/variaveis/11709?localidades=N1[all]",
    },
]

TIMEOUT = 30


def _fetch_json(url):
    """Busca URL e retorna JSON parseado."""
    import gzip
    req = Request(url)
    req.add_header("User-Agent", "MercadoFranquia/1.0")
    with urlopen(req, timeout=TIMEOUT, context=SSL_CTX) as resp:
        raw = resp.read()
        # Decodifica gzip se necessário (IBGE retorna gzip sem pedir)
        if raw[:2] == b"\x1f\x8b":
            raw = gzip.decompress(raw)
        return json.loads(raw.decode("utf-8"))


def _log_sync(conn, fonte, status, registros=0, erro=None):
    """Registra resultado no sync_log."""
    conn.execute(
        "INSERT INTO sync_log(fonte, status, registros_inseridos, erro) VALUES(?,?,?,?)",
        (fonte, status, registros, erro),
    )
    conn.commit()


# ── BCB ──────────────────────────────────────────────────────────────────────

def sync_bcb():
    """Busca séries históricas do Banco Central do Brasil."""
    conn = get_conn()
    total = 0

    for codigo, nome in SERIES_BCB.items():
        fonte = f"BCB/{nome} ({codigo})"
        chunks = BCB_CHUNKS if codigo in SERIES_DIARIAS else BCB_CHUNK_UNICO
        try:
            dados = []
            for data_ini, data_fim in chunks:
                url = (
                    f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}"
                    f"/dados?formato=json&dataInicial={data_ini}"
                )
                if data_fim:
                    url += f"&dataFinal={data_fim}"
                dados.extend(_fetch_json(url))

            inseridos = 0

            for item in dados:
                data_raw = item.get("data", "")
                valor_raw = item.get("valor", "")
                if not valor_raw or valor_raw == "":
                    continue
                try:
                    valor = float(valor_raw)
                except (ValueError, TypeError):
                    continue

                # Converte dd/mm/aaaa → aaaa-mm-dd
                partes = data_raw.split("/")
                if len(partes) == 3:
                    data_iso = f"{partes[2]}-{partes[1]}-{partes[0]}"
                else:
                    data_iso = data_raw

                conn.execute(
                    """INSERT INTO macro_bcb(data, codigo_serie, nome_serie, valor)
                       VALUES(?,?,?,?)
                       ON CONFLICT(data, codigo_serie) DO UPDATE SET valor=excluded.valor""",
                    (data_iso, codigo, nome, valor),
                )
                inseridos += 1

            conn.commit()
            total += inseridos
            _log_sync(conn, fonte, "ok", inseridos)
            print(f"  [OK] {fonte}: {inseridos} registros")

        except (URLError, json.JSONDecodeError, Exception) as e:
            _log_sync(conn, fonte, "erro", 0, str(e))
            print(f"  [ERRO] {fonte}: {e}")

    conn.close()
    return total


# ── IBGE ─────────────────────────────────────────────────────────────────────

def sync_ibge():
    """Busca dados agregados do IBGE (PIB por estado, PMC)."""
    conn = get_conn()
    total = 0

    for endpoint in ENDPOINTS_IBGE:
        fonte = f"IBGE/{endpoint['nome']} ({endpoint['codigo_agregado']})"
        try:
            dados = _fetch_json(endpoint["url"])
            inseridos = 0

            # A API do IBGE retorna lista de variáveis, cada uma com resultados por localidade
            for variavel_obj in dados:
                nome_variavel = variavel_obj.get("variavel", endpoint["nome"])
                resultados = variavel_obj.get("resultados", [])

                for resultado in resultados:
                    # Cada resultado tem classificações e séries por localidade
                    series = resultado.get("series", [])

                    for serie in series:
                        localidade = serie.get("localidade", {}).get("nome", "Brasil")
                        valores = serie.get("serie", {})

                        for periodo, valor_raw in valores.items():
                            if not valor_raw or valor_raw in ("...", "-", "X"):
                                continue
                            try:
                                valor = float(valor_raw)
                            except (ValueError, TypeError):
                                continue

                            conn.execute(
                                """INSERT INTO macro_ibge(data, codigo_agregado, variavel, localidade, valor)
                                   VALUES(?,?,?,?,?)
                                   ON CONFLICT(data, codigo_agregado, variavel, localidade)
                                   DO UPDATE SET valor=excluded.valor""",
                                (periodo, endpoint["codigo_agregado"], nome_variavel, localidade, valor),
                            )
                            inseridos += 1

            conn.commit()
            total += inseridos
            _log_sync(conn, fonte, "ok", inseridos)
            print(f"  [OK] {fonte}: {inseridos} registros")

        except (URLError, json.JSONDecodeError, Exception) as e:
            _log_sync(conn, fonte, "erro", 0, str(e))
            print(f"  [ERRO] {fonte}: {e}")

    conn.close()
    return total


# ── PMC (Pesquisa Mensal de Comércio — IBGE tabela 8882) ─────────────────────

def sync_pmc():
    """Busca dados de varejo por segmento da PMC/IBGE."""
    conn = get_conn()
    fonte = "IBGE/PMC (8882)"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        periodos = _periodos_mensais_ibge(2014, 2026)
        url = (
            f"https://servicodados.ibge.gov.br/api/v3/agregados/8882"
            f"/periodos/{periodos}"
            f"/variaveis/11709|11710"
            f"?localidades=N1[all]"
            f"&classificacao=11046[56734]|85[all]"
        )
        dados = _fetch_json(url)
        inseridos = 0

        # Mapeia variável ID → coluna no banco
        VAR_COL = {"11709": "variacao_mensal", "11710": "variacao_anual"}

        for variavel_obj in dados:
            var_id = str(variavel_obj.get("id", ""))
            coluna = VAR_COL.get(var_id)
            if not coluna:
                continue

            for resultado in variavel_obj.get("resultados", []):
                # Extrair segmento da classificação 85
                classificacoes = resultado.get("classificacoes", [])
                segmento_map = {}
                for clf in classificacoes:
                    if clf.get("id") == "85":
                        segmento_map = clf.get("categoria", {})
                        break

                if not segmento_map:
                    continue

                # Deve haver exatamente 1 segmento por bloco de resultado
                codigo_seg = list(segmento_map.keys())[0]
                nome_seg = segmento_map[codigo_seg]

                for serie in resultado.get("series", []):
                    valores = serie.get("serie", {})
                    for periodo_raw, valor_raw in valores.items():
                        if not valor_raw or valor_raw in ("..", "...", "-", "X"):
                            continue
                        try:
                            valor = float(valor_raw)
                        except (ValueError, TypeError):
                            continue

                        # YYYYMM → YYYY-MM
                        data = f"{periodo_raw[:4]}-{periodo_raw[4:6]}"

                        if coluna == "variacao_mensal":
                            conn.execute(
                                """INSERT INTO pmc_ibge(data, codigo_segmento, nome_segmento,
                                       variacao_mensal, data_coleta)
                                   VALUES(?,?,?,?,?)
                                   ON CONFLICT(data, codigo_segmento) DO UPDATE SET
                                       variacao_mensal=excluded.variacao_mensal,
                                       data_coleta=excluded.data_coleta""",
                                (data, codigo_seg, nome_seg, valor, now),
                            )
                        else:
                            conn.execute(
                                """INSERT INTO pmc_ibge(data, codigo_segmento, nome_segmento,
                                       variacao_anual, data_coleta)
                                   VALUES(?,?,?,?,?)
                                   ON CONFLICT(data, codigo_segmento) DO UPDATE SET
                                       variacao_anual=excluded.variacao_anual,
                                       data_coleta=excluded.data_coleta""",
                                (data, codigo_seg, nome_seg, valor, now),
                            )
                        inseridos += 1

        conn.commit()
        _log_sync(conn, fonte, "ok", inseridos)
        print(f"  [OK] {fonte}: {inseridos} registros")
        conn.close()
        return inseridos

    except Exception as e:
        _log_sync(conn, fonte, "erro", 0, str(e))
        print(f"  [ERRO] {fonte}: {e}")
        conn.close()
        return 0


# ── CAGED (emprego formal via BCB SGS) ──────────────────────────────────────

def sync_caged():
    """Busca estoque de emprego formal por setor via BCB SGS."""
    conn = get_conn()
    total = 0
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for codigo, setor in SERIES_CAGED.items():
        fonte = f"BCB/CAGED {setor} ({codigo})"
        try:
            url_base = (
                f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}"
                f"/dados?formato=json&dataInicial=01/01/2014"
            )
            dados = _fetch_json(url_base)
            inseridos = 0
            prev_estoque = None

            for item in dados:
                data_raw = item.get("data", "")
                valor_raw = item.get("valor", "")
                if not valor_raw:
                    continue
                try:
                    estoque = float(valor_raw)
                except (ValueError, TypeError):
                    continue

                # dd/mm/aaaa → YYYY-MM-DD
                partes = data_raw.split("/")
                if len(partes) == 3:
                    data_iso = f"{partes[2]}-{partes[1]}-{partes[0]}"
                else:
                    data_iso = data_raw

                saldo = (estoque - prev_estoque) if prev_estoque is not None else None

                conn.execute(
                    """INSERT INTO caged_bcb(data, estoque, saldo, setor, codigo_bcb,
                           url_fonte, data_coleta)
                       VALUES(?,?,?,?,?,?,?)
                       ON CONFLICT(data, codigo_bcb) DO UPDATE SET
                           estoque=excluded.estoque, saldo=excluded.saldo,
                           data_coleta=excluded.data_coleta""",
                    (data_iso, estoque, saldo, setor, codigo, url_base, now),
                )
                prev_estoque = estoque
                inseridos += 1

            conn.commit()
            total += inseridos
            _log_sync(conn, fonte, "ok", inseridos)
            print(f"  [OK] {fonte}: {inseridos} registros")

        except Exception as e:
            _log_sync(conn, fonte, "erro", 0, str(e))
            print(f"  [ERRO] {fonte}: {e}")

    conn.close()
    return total


# ── Main ─────────────────────────────────────────────────────────────────────

def sync_all():
    """Executa todos os syncs."""
    print(f"\n{'='*60}")
    print(f"  Sync de dados — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

    # Garante que as tabelas existem
    init_db()

    print("[BCB] Buscando séries históricas...")
    bcb_total = sync_bcb()

    print(f"\n[IBGE] Buscando dados agregados...")
    ibge_total = sync_ibge()

    print(f"\n[IBGE/PMC] Buscando dados de varejo por segmento...")
    pmc_total = sync_pmc()

    print(f"\n[BCB/CAGED] Buscando dados de emprego formal...")
    caged_total = sync_caged()

    print(f"\n{'='*60}")
    print(f"  Concluído: {bcb_total} BCB + {ibge_total} IBGE + {pmc_total} PMC + {caged_total} CAGED")
    print(f"{'='*60}\n")

    return bcb_total + ibge_total + pmc_total + caged_total


if __name__ == "__main__":
    sync_all()
